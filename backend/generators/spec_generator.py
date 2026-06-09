"""
Spec Generator
--------------
YAML testcases + contract → Playwright E2E specs and POMs.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

from lib.assertions import map_assertions
from lib.contract import Contract, load_contract, page_id_to_pom_name
from lib.llm import LLMClient
from lib.paths import ensure_app_dirs
from lib.prompts import spec_body_prompt

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

SCAFFOLD_FILES: dict[str, str] = {
    "package.json": """{
  "name": "qa-output",
  "private": true,
  "scripts": {
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@types/node": "^22.0.0",
    "dotenv": "^16.4.0",
    "typescript": "^5.6.0"
  }
}
""",
    "tsconfig.json": """{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["tests/**/*.ts", "playwright.config.ts"]
}
""",
    ".env.qa.example": "QA_UI_BASE_URL=https://your-app.example.com\n",
    "tests/scripts/helpers/env.ts": """export function uiBaseUrl(): string {
  return process.env.QA_UI_BASE_URL ?? 'http://localhost:3000'
}
""",
    "tests/scripts/helpers/auth-fixture.ts": """import fs from 'fs'
import path from 'path'

const AUTH_DIR = path.join(__dirname, '../fixtures/auth')

export function storageStatePath(actor = 'public'): string {
  return path.join(AUTH_DIR, `${actor}.json`)
}

export function hasAuthFixture(actor = 'public'): boolean {
  return fs.existsSync(storageStatePath(actor))
}
""",
}


def _playwright_config(base_url: str) -> str:
    return f"""import {{ defineConfig, devices }} from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({{ path: path.resolve(__dirname, '.env.qa') }})

export default defineConfig({{
  testDir: './tests/scripts/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['list'], ['html', {{ open: 'never' }}]],
  use: {{
    ...devices['Desktop Chrome'],
    baseURL: process.env.QA_UI_BASE_URL ?? '{base_url}',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  }},
}})
"""


def scaffold_app(root: Path, contract: Contract) -> None:
    for rel, content in SCAFFOLD_FILES.items():
        path = root / rel
        if path.exists():
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        log.info("  Scaffolded: %s", rel)

    pw_config = root / "playwright.config.ts"
    if not pw_config.exists():
        pw_config.write_text(_playwright_config(contract.base_url), encoding="utf-8")
        log.info("  Scaffolded: playwright.config.ts")


def _escape_ts_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def generate_pom(page: dict, class_name: str) -> str:
    lines = [
        "/** AUTO-GENERATED from UI contract — review before commit */",
        "import { expect, Locator, Page } from '@playwright/test'",
        "",
        f"export class {class_name} {{",
        "  constructor(readonly page: Page) {}",
        "",
    ]

    for element in page.get("elements", [])[:40]:
        eid = element.get("element_id", "el")
        method = re.sub(r"[^a-zA-Z0-9_]", "_", eid)
        pw = element.get("selectors", {}).get("playwright", "")
        xpath = element.get("selectors", {}).get("xpath", "")
        label = element.get("label", eid)

        if pw:
            locator_expr = pw.replace("page.", "this.page.")
        elif xpath:
            locator_expr = f"this.page.locator('xpath={_escape_ts_string(xpath)}')"
        else:
            locator_expr = f"this.page.getByRole('button', {{ name: '{_escape_ts_string(label)}' }})"

        lines.append(f"  /** {element.get('description', label)} */")
        lines.append(f"  {method}(): Locator {{")
        lines.append(f"    return {locator_expr}")
        lines.append("  }")
        lines.append("")

    for form in page.get("forms", []):
        for field in form.get("fields", []):
            fid = field.get("field_id", "field")
            method = re.sub(r"[^a-zA-Z0-9_]", "_", fid)
            pw = field.get("selectors", {}).get("playwright", "")
            xpath = field.get("selectors", {}).get("xpath", "")
            if pw:
                locator_expr = pw.replace("page.", "this.page.")
            elif xpath:
                locator_expr = f"this.page.locator('xpath={_escape_ts_string(xpath)}')"
            else:
                locator_expr = f"this.page.locator('[name=\"{_escape_ts_string(field.get('name', fid))}\"]')"

            lines.append(f"  /** {field.get('description', fid)} */")
            lines.append(f"  {method}Field(): Locator {{")
            lines.append(f"    return {locator_expr}")
            lines.append("  }")
            lines.append("")

    lines.append("  async expectLoaded(): Promise<void> {")
    lines.append(f"    await expect(this.page).toHaveURL(/.*/)")
    lines.append("  }")
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def _build_nav_links_constant(flow: dict) -> str:
    cases = flow.get("cases", [])
    nav_links: list[dict] = []
    for case in cases:
        nav_links.extend(case.get("nav_links") or [])
    if not nav_links:
        return ""

    entries = []
    for link in nav_links:
        label = _escape_ts_string(link.get("label", ""))
        route = _escape_ts_string(link.get("route", ""))
        header = _escape_ts_string(link.get("header", link.get("label", "")))
        entries.append(f"  {{ label: '{label}', route: '{route}', header: '{header}' }},")

    return "export const NAV_LINKS = [\n" + "\n".join(entries) + "\n] as const\n\n"


def generate_spec(
    flow: dict,
    contract: Contract,
    yaml_path: Path,
    llm: LLMClient | None = None,
    use_llm_body: bool = False,
) -> str:
    llm = llm or LLMClient()
    module = flow.get("module", "general")
    flow_id = flow.get("flow_id", "FLOW-01")
    tags = " ".join(f"@{t}" for t in flow.get("tags", ["regression"]))
    tag_str = f"{tags} @{flow_id}"
    actors = flow.get("actors", ["public"])
    actor = actors[0] if actors else "public"

    pom_names = flow.get("ui_pages", [])
    has_nav = any(case.get("nav_links") for case in flow.get("cases", []))
    imports = ["import { test, expect } from '@playwright/test'"]
    if actor != "public":
        imports.append("import { hasAuthFixture, storageStatePath } from '../../helpers/auth-fixture'")
    nav_imported = False
    for pom in pom_names:
        if has_nav and not nav_imported:
            imports.append(f"import {{ {pom}, NAV_LINKS }} from '../../pages/{pom}.page'")
            nav_imported = True
        else:
            imports.append(f"import {{ {pom} }} from '../../pages/{pom}.page'")

    header = [
        f"/** AUTO-GENERATED from {yaml_path.name} */",
        f"/** Contract: {contract.path.name} v{contract.version} */",
        f"/** Flow: {flow_id} — review assertions before commit */",
    ]

    describe_lines = [
        *header,
        "",
        *imports,
        "",
        f"test.describe('{flow_id} {flow.get('flow_name', '')} {tag_str}', () => {{",
    ]

    if actor != "public":
        describe_lines.append(f"  test.skip(!hasAuthFixture('{actor}'), 'Auth fixture not configured')")
        describe_lines.append(f"  test.use({{ storageState: storageStatePath('{actor}') }})")
        describe_lines.append("")

    first_page = contract.pages_for_module(module)
    start_path = first_page[0].get("path", "/") if first_page else "/"
    describe_lines.append("  test.beforeEach(async ({ page }) => {")
    describe_lines.append(f"    await page.goto('{start_path or '/'}')")
    describe_lines.append("  })")
    describe_lines.append("")

    if use_llm_body:
        slice_data = contract.slice_for_module(module)
        body = llm.complete(
            spec_body_prompt(flow, slice_data, pom_names),
            temperature=0.2,
            max_tokens=2000,
        )
        body = body.replace("```typescript", "").replace("```", "").strip()
        for line in body.splitlines():
            describe_lines.append(f"  {line}")
    else:
        for case in flow.get("cases", []):
            case_id = case.get("id", "case")
            title = case.get("title", case_id)
            describe_lines.append(f"  test('{case_id}: {title}', async ({{ page }}) => {{")

            nav_links = case.get("nav_links") or []
            if nav_links:
                describe_lines.append("    for (const link of NAV_LINKS) {")
                describe_lines.append("      await page.goto(link.route)")
                for line in map_assertions(
                    case.get("assertions", ["page_loads"]),
                    {"route": "", "header": ""},
                ):
                    describe_lines.append(f"      {line}")
                describe_lines.append("    }")
            else:
                for ref in case.get("element_refs", [])[:5]:
                    eid = ref.get("element_id")
                    page_data = contract.get_page(ref.get("page_id", ""))
                    if page_data:
                        for el in page_data.get("elements", []):
                            if el.get("element_id") == eid:
                                pw = el.get("selectors", {}).get("playwright", "")
                                if pw:
                                    describe_lines.append(f"    await {pw}.click();")
                                break

                for line in map_assertions(case.get("assertions", ["page_loads"])):
                    describe_lines.append(f"    {line}")

            describe_lines.append("  })")
            describe_lines.append("")

    describe_lines.append("})")
    describe_lines.append("")
    return "\n".join(describe_lines)


def generate_specs_for_flow(
    contract: Contract,
    app_slug: str,
    flow_id: str,
    llm: LLMClient | None = None,
) -> list[Path]:
    root = ensure_app_dirs(app_slug)
    scaffold_app(root, contract)

    testcase_dir = root / "tests" / "testcases"
    candidates: list[tuple[Path, dict]] = []
    for path in testcase_dir.rglob(f"{flow_id}.yaml"):
        with path.open(encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        candidates.append((path, data))

    if not candidates:
        flow_data = None
        yaml_path = None
    else:
        def score(item: tuple[Path, dict]) -> int:
            path, data = item
            module = data.get("module", "")
            if path.parent.name == module:
                return 0
            return 1

        candidates.sort(key=score)
        yaml_path, flow_data = candidates[0]

    if not flow_data or not yaml_path:
        raise FileNotFoundError(f"No YAML found for flow {flow_id}")

    module = flow_data.get("module", "general")
    written: list[Path] = []

    page_id_map = {page_id_to_pom_name(p.get("page_id", "")): p for p in contract.pages}
    for page_name in flow_data.get("ui_pages", []):
        page_data = page_id_map.get(page_name)
        if not page_data:
            page_id = page_name.replace("Page", "").lower().replace("_", "-")
            page_data = contract.get_page(page_id)
        if not page_data:
            log.warning("No contract page for POM %s — skipping", page_name)
            continue

        pom_path = root / "tests" / "scripts" / "pages" / f"{page_name}.page.ts"
        nav_const = _build_nav_links_constant(flow_data)
        pom_content = (nav_const if nav_const else "") + generate_pom(page_data, page_name)
        pom_path.write_text(pom_content, encoding="utf-8")
        written.append(pom_path)
        log.info("  Written POM: %s", pom_path)

    spec_dir = root / "tests" / "scripts" / "e2e" / module
    spec_dir.mkdir(parents=True, exist_ok=True)
    spec_path = spec_dir / f"{flow_id}.e2e.spec.ts"
    spec_content = generate_spec(flow_data, contract, yaml_path, llm=llm)
    spec_path.write_text(spec_content, encoding="utf-8")
    written.append(spec_path)
    log.info("  Written spec: %s", spec_path)

    return written


def generate_all_specs(
    contract: Contract,
    app_slug: str,
    llm: LLMClient | None = None,
) -> list[Path]:
    root = ensure_app_dirs(app_slug)
    scaffold_app(root, contract)
    written: list[Path] = []
    seen_flow_ids: set[str] = set()

    for yaml_path in sorted((root / "tests" / "testcases").rglob("*.yaml")):
        with yaml_path.open(encoding="utf-8") as f:
            flow = yaml.safe_load(f) or {}
        flow_id = flow.get("flow_id")
        if not flow_id or flow_id in seen_flow_ids:
            continue
        seen_flow_ids.add(flow_id)
        log.info("Generating spec for flow: %s (from %s)", flow_id, yaml_path.parent.name)
        written.extend(generate_specs_for_flow(contract, app_slug, flow_id, llm=llm))

    return written


def main():
    parser = argparse.ArgumentParser(description="Generate Playwright E2E specs from YAML + contract")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--app", required=True)
    parser.add_argument("--flow", help="Single flow ID (default: all YAML in output)")
    args = parser.parse_args()

    contract = load_contract(args.contract)
    if args.flow:
        paths = generate_specs_for_flow(contract, args.app, args.flow)
    else:
        paths = generate_all_specs(contract, args.app)

    print(f"\nDone! {len(paths)} file(s) written.")


if __name__ == "__main__":
    main()
