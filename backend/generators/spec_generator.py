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
from lib.artifacts import spec_path as canonical_spec_path
from lib.artifacts import spec_rel
from lib.artifacts import testcase_path as canonical_testcase_path
from lib.paths import ensure_app_dirs
from lib.prompts import spec_body_prompt
from lib.workspace import register_spec

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


def _normalize_page_id(page_id: str) -> str:
    if not page_id:
        return ""
    if page_id.endswith("Page"):
        stem = page_id[:-4]
        if stem.lower() == "home":
            return "home"
        return re.sub(r"(?<!^)(?=[A-Z])", "-", stem).lower().replace("_", "-")
    return page_id.lower().replace("_", "-")


def _find_element(
    contract: Contract,
    *,
    element_id: str | None = None,
    label: str | None = None,
    page_id: str | None = None,
) -> dict | None:
    pid = _normalize_page_id(page_id) if page_id else None
    pages = contract.pages
    if pid:
        page = contract.get_page(pid)
        pages = [page] if page else []

    for page in pages or contract.pages:
        for element in page.get("elements", []):
            if element_id and element.get("element_id") == element_id:
                return element
            if label and element.get("label", "").strip().lower() == label.strip().lower():
                return element

    if element_id or label:
        for page in contract.pages:
            for element in page.get("elements", []):
                if element_id and element.get("element_id") == element_id:
                    return element
                if label and element.get("label", "").strip().lower() == label.strip().lower():
                    return element
    return None


def _nav_link_from_element(contract: Contract, element: dict) -> dict[str, str]:
    label = element.get("label", "")
    route = element.get("target_path") or "/"
    if not route.startswith("/") and element.get("href"):
        from urllib.parse import urlparse

        route = urlparse(element["href"]).path or "/"
    return {"label": label, "route": route or "/", "header": label}


def _normalize_nav_link(
    link: Any,
    contract: Contract,
    ref: dict | None = None,
) -> dict[str, str] | None:
    if isinstance(link, str):
        label = link.strip()
        if not label:
            return None
        element = None
        if ref and isinstance(ref, dict):
            element = _find_element(
                contract,
                element_id=ref.get("element_id"),
                page_id=ref.get("page_id"),
            )
        if not element:
            element = _find_element(contract, label=label)
        if element:
            return _nav_link_from_element(contract, element)
        return {"label": label, "route": "/", "header": label}

    if not isinstance(link, dict):
        return None

    label = str(link.get("label") or "")
    route = str(link.get("route") or "")
    header = str(link.get("header") or label)

    if link.get("expected_url"):
        from urllib.parse import urlparse

        route = route or urlparse(str(link["expected_url"])).path or "/"

    element_id = link.get("element_id")
    if element_id and (not label or not route or route == "/"):
        element = _find_element(contract, element_id=str(element_id))
        if element:
            enriched = _nav_link_from_element(contract, element)
            label = label or enriched["label"]
            route = route if route and route != "/" else enriched["route"]
            header = header or enriched["header"]

    if ref and isinstance(ref, dict) and ref.get("element_id") and not label:
        element = _find_element(
            contract,
            element_id=ref.get("element_id"),
            page_id=ref.get("page_id"),
        )
        if element:
            enriched = _nav_link_from_element(contract, element)
            label = enriched["label"]
            route = route or enriched["route"]
            header = header or enriched["header"]

    if not label and not route:
        return None
    return {"label": label, "route": route or "/", "header": header or label}


def _collect_nav_links(case: dict, contract: Contract) -> list[dict[str, str]]:
    raw = case.get("nav_links") or []
    refs = case.get("element_refs") or []
    links: list[dict[str, str]] = []

    if not raw:
        for ref in refs:
            if not isinstance(ref, dict):
                continue
            element = _find_element(
                contract,
                element_id=ref.get("element_id"),
                page_id=ref.get("page_id"),
            )
            if element:
                links.append(_nav_link_from_element(contract, element))
        return links

    for i, item in enumerate(raw):
        ref = refs[i] if i < len(refs) and isinstance(refs[i], dict) else None
        normalized = _normalize_nav_link(item, contract, ref)
        if normalized:
            links.append(normalized)
    return links


def _build_nav_links_constant(flow: dict, contract: Contract) -> str:
    nav_links: list[dict[str, str]] = []
    for case in flow.get("cases", []):
        nav_links.extend(_collect_nav_links(case, contract))
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
    has_nav = any(_collect_nav_links(case, contract) for case in flow.get("cases", []))
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

            nav_links = _collect_nav_links(case, contract)
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
                for ref in case.get("element_refs", [])[:20]:
                    if not isinstance(ref, dict):
                        continue
                    eid = ref.get("element_id")
                    page_data = contract.get_page(_normalize_page_id(ref.get("page_id", "")))
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


def generate_spec_for_plan(
    contract: Contract,
    app_slug: str,
    plan_id: str,
    llm: LLMClient | None = None,
) -> list[Path]:
    """1 plan → 1 case.yaml → 1 case.e2e.spec.ts."""
    root = ensure_app_dirs(app_slug)
    scaffold_app(root, contract)

    yaml_path = canonical_testcase_path(root, plan_id)
    if not yaml_path.exists():
        legacy = list((root / "tests" / "testcases" / plan_id).glob("*.yaml"))
        if legacy:
            yaml_path = legacy[0]
        else:
            raise FileNotFoundError(f"No testcase YAML for plan {plan_id}")

    with yaml_path.open(encoding="utf-8") as f:
        flow_data = yaml.safe_load(f) or {}

    written: list[Path] = []

    page_id_map = {page_id_to_pom_name(p.get("page_id", "")): p for p in contract.pages}
    for page_name in flow_data.get("ui_pages", []):
        page_data = page_id_map.get(page_name)
        if not page_data:
            page_id_name = page_name.replace("Page", "").lower().replace("_", "-")
            page_data = contract.get_page(page_id_name)
        if not page_data:
            log.warning("No contract page for POM %s — skipping", page_name)
            continue

        pom_path = root / "tests" / "scripts" / "pages" / f"{page_name}.page.ts"
        nav_const = _build_nav_links_constant(flow_data, contract)
        pom_content = (nav_const if nav_const else "") + generate_pom(page_data, page_name)
        pom_path.write_text(pom_content, encoding="utf-8")
        written.append(pom_path)
        log.info("  Written POM: %s", pom_path)

    spec_dir = canonical_spec_path(root, plan_id).parent
    spec_dir.mkdir(parents=True, exist_ok=True)
    out_spec = canonical_spec_path(root, plan_id)

    for old in spec_dir.glob("*.e2e.spec.ts"):
        if old != out_spec:
            old.unlink()
            log.info("  Removed extra spec: %s", old.name)

    spec_content = generate_spec(flow_data, contract, yaml_path, llm=llm)
    out_spec.write_text(spec_content, encoding="utf-8")
    written.append(out_spec)
    register_spec(app_slug, plan_id, plan_id, spec_rel(plan_id))
    log.info("  Written spec: %s", out_spec)

    return written


def generate_specs_for_plan_flow(
    contract: Contract,
    app_slug: str,
    plan_id: str,
    flow_id: str | None = None,
    llm: LLMClient | None = None,
) -> list[Path]:
    return generate_spec_for_plan(contract, app_slug, plan_id, llm=llm)


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
        raise FileNotFoundError(f"No YAML found for flow {flow_id}")

    def score(item: tuple[Path, dict]) -> int:
        path, data = item
        module = data.get("module", "")
        if path.parent.name == module:
            return 0
        if path.parent.name.startswith("plan-"):
            return 0
        return 1

    candidates.sort(key=score)
    yaml_path, flow_data = candidates[0]
    plan_id = yaml_path.parent.name
    return generate_specs_for_plan_flow(contract, app_slug, plan_id, flow_id, llm=llm)


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
