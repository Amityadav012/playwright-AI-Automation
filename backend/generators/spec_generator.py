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

from lib.assertions import assert_line_from_contract, map_assertions, map_assertions_for_nav_loop
from lib.contract import Contract, load_contract, page_id_to_pom_name
from lib.llm import LLMClient
from lib.artifacts import spec_path as canonical_spec_path
from lib.artifacts import spec_rel
from lib.artifacts import testcase_path as canonical_testcase_path
from lib.paths import ensure_app_dirs
from lib.prompts import spec_body_prompt, spec_case_prompt
from lib.workspace import register_spec

COVERAGE_LLM_THRESHOLD = 0.5

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
    "@playwright/test": "^1.60.0",
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
    value = value.replace("\\", "\\\\").replace("'", "\\'")
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = value.replace("\n", "\\n")
    return value


def _normalize_playwright_selector(pw: str, *, page_var: str = "this.page") -> str:
    """Rewrite contract selectors so embedded name strings are valid TS literals."""
    pw = pw.strip().replace("page.", f"{page_var}.")

    def fix_single_quoted(m: re.Match[str]) -> str:
        inner = m.group(1)
        return f"{{ name: '{_escape_ts_string(inner)}' }}"

    def fix_double_quoted(m: re.Match[str]) -> str:
        inner = m.group(1)
        escaped = (
            inner.replace("\\", "\\\\")
            .replace('"', '\\"')
            .replace("\r\n", "\n")
            .replace("\r", "\n")
            .replace("\n", "\\n")
        )
        return f'{{ name: "{escaped}" }}'

    pw = re.sub(r"\{\s*name:\s*'(.*?)'\s*\}", fix_single_quoted, pw, flags=re.DOTALL)
    pw = re.sub(r'\{\s*name:\s*"(.*?)"\s*\}', fix_double_quoted, pw, flags=re.DOTALL)
    return pw


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

        role = element.get("role", "button")
        if pw:
            locator_expr = _normalize_playwright_selector(pw)
        elif xpath:
            locator_expr = f"this.page.locator('xpath={_escape_ts_string(xpath)}')"
        else:
            pw_role = {"link": "link", "button": "button", "input": "textbox"}.get(role, "button")
            locator_expr = f"this.page.getByRole('{pw_role}', {{ name: '{_escape_ts_string(label)}' }})"

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
                locator_expr = _normalize_playwright_selector(pw)
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
            element = _find_element(contract, label=label, page_id="home")
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
    route_from_expected = False

    if link.get("expected_url"):
        from urllib.parse import urlparse

        parsed = urlparse(str(link["expected_url"]))
        route = parsed.path or "/"
        if parsed.fragment:
            route = f"/#{parsed.fragment}"
        route_from_expected = True

    element_id = link.get("element_id")
    if element_id:
        element = None
        home = contract.get_page("home")
        if home:
            for el in home.get("elements", []):
                if el.get("element_id") == str(element_id):
                    element = el
                    break
        if not element:
            element = _find_element(contract, element_id=str(element_id), page_id="home")
        if element:
            label = label or element.get("label", "")
            header = header or label
            if not route_from_expected and not route:
                route = _nav_link_from_element(contract, element)["route"]

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
    out: dict[str, str] = {
        "label": label,
        "route": route or "/",
        "header": header or label,
    }
    if element_id:
        out["element_id"] = str(element_id)
    if isinstance(link, dict):
        if link.get("assert"):
            out["assert"] = link["assert"]
        if link.get("raw_href"):
            out["raw_href"] = str(link["raw_href"])
    return out


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


def _resolve_start_path(flow: dict, contract: Contract, module: str) -> str:
    ui_pages = flow.get("ui_pages") or []
    if "HomePage" in ui_pages:
        home = contract.get_page("home")
        if home:
            return home.get("path", "/") or "/"
    for case in flow.get("cases", []):
        for ref in case.get("element_refs") or []:
            if not isinstance(ref, dict):
                continue
            page = contract.get_page(_normalize_page_id(ref.get("page_id", "")))
            if page:
                return page.get("path", "/") or "/"
    pages = contract.pages_for_module(module)
    if pages:
        return pages[0].get("path", "/") or "/"
    return "/"


def _resolve_click_element(
    contract: Contract,
    ref: dict,
    *,
    home_page: dict | None,
    label_fallback: str | None = None,
) -> dict | None:
    """Resolve a contract element on home by id, then by label."""
    eid = ref.get("element_id")
    if home_page and eid:
        for el in home_page.get("elements", []):
            if el.get("element_id") == eid:
                return el
    if home_page and label_fallback:
        for el in home_page.get("elements", []):
            if el.get("label", "").strip().lower() == label_fallback.strip().lower():
                return el
    if eid:
        page = contract.get_page(_normalize_page_id(ref.get("page_id", "")))
        if page:
            for el in page.get("elements", []):
                if el.get("element_id") == eid:
                    return el
    return _find_element(contract, element_id=eid) if eid else None


def _structured_nav_links(case: dict) -> bool:
    raw = case.get("nav_links") or []
    return bool(raw) and all(isinstance(x, dict) for x in raw)


def _is_nav_case(case: dict) -> bool:
    """Nav-like case: structured nav_links (validated by contract), regardless of flow.module."""
    if not _structured_nav_links(case):
        return False
    return any(
        isinstance(link, dict) and (link.get("element_id") or link.get("assert"))
        for link in case.get("nav_links", [])
    )


def _case_element_coverage(case: dict, contract: Contract) -> float:
    refs = [r for r in case.get("element_refs", []) if isinstance(r, dict)]
    if not refs:
        return 1.0 if _is_nav_case(case) else 1.0
    home_page = contract.get_page("home")
    resolved = sum(
        1
        for ref in refs
        if _resolve_click_element(contract, ref, home_page=home_page)
    )
    return resolved / len(refs)


def _allowed_selectors(contract_slice: dict) -> set[str]:
    allowed: set[str] = set()
    for page in contract_slice.get("pages", []):
        for element in page.get("elements", []):
            pw = element.get("selectors", {}).get("playwright", "")
            if pw:
                allowed.add(pw.strip())
    return allowed


def _sanitize_llm_body(body: str, allowed: set[str], contract: Contract, case: dict) -> str:
    """Strip fences and reject selectors not in contract allowlist."""
    body = body.replace("```typescript", "").replace("```ts", "").replace("```", "").strip()
    if not allowed:
        return body
    lines = body.splitlines()
    out: list[str] = []
    for line in lines:
        stripped = line.strip()
        if "getByRole" in stripped or "locator(" in stripped:
            if not any(sel.split(".first()")[0] in stripped for sel in allowed):
                out.append(f"    // stripped non-contract selector: {stripped[:80]}")
                continue
        out.append(line)
    return "\n".join(out)


def _url_assert_for_element_click(element: dict, norm: dict | None = None) -> str | None:
    assert_meta = None
    route = ""
    if norm:
        assert_meta = norm.get("assert") if isinstance(norm.get("assert"), dict) else None
        route = norm.get("route", "") or ""
    if not assert_meta:
        tp = element.get("target_path") or ""
        if tp.startswith("/#"):
            assert_meta = {"kind": "hash", "value": tp[1:]}
            route = tp
        elif tp and tp != "/":
            route = tp
    line = assert_line_from_contract(assert_meta or {}, route)
    if line:
        return line
    if route and route != "/":
        return _url_assert_for_nav(route, element, assert_meta)
    return None


def _emit_nav_case_body(
    describe_lines: list[str],
    case: dict,
    contract: Contract,
    start_path: str,
) -> None:
    nav_links = _collect_nav_links(case, contract)
    home_page = contract.get_page("home")
    for norm in nav_links:
        route = norm.get("route", "/")
        if route == "/":
            continue
        element = _resolve_home_nav_element(contract, home_page, norm)
        if not element:
            log.warning(
                "Skipping nav link %s (%s): not on home page",
                norm.get("label"),
                norm.get("element_id"),
            )
            continue
        click_expr = _click_expr_for_element(element) or _click_expr_for_nav_element(element, route)
        if not click_expr:
            continue
        describe_lines.append(f"    await page.goto('{start_path or '/'}')")
        describe_lines.append(f"    await {click_expr}")
        describe_lines.append(f"    {_url_assert_for_nav(route, element, norm.get('assert'))}")
        describe_lines.append("    await expect(page).toHaveTitle(/.+/);")


def _emit_deterministic_case_body(
    describe_lines: list[str],
    case: dict,
    contract: Contract,
    start_path: str,
) -> int:
    element_refs = [r for r in case.get("element_refs", [])[:30] if isinstance(r, dict)]
    nav_links = _collect_nav_links(case, contract)
    raw_nav_labels = [x for x in case.get("nav_links") or [] if isinstance(x, str)]
    home_page = contract.get_page("home")
    clicks_written = 0

    if _is_nav_case(case) and nav_links:
        _emit_nav_case_body(describe_lines, case, contract, start_path)
        return len([n for n in nav_links if n.get("route", "/") != "/"])

    for i, ref in enumerate(element_refs):
        label_fb = raw_nav_labels[i] if i < len(raw_nav_labels) else None
        element = _resolve_click_element(
            contract, ref, home_page=home_page, label_fallback=label_fb
        )
        if element:
            click_expr = _click_expr_for_element(element)
            if click_expr:
                describe_lines.append(f"    await page.goto('{start_path or '/'}')")
                describe_lines.append(f"    await {click_expr}")
                url_line = _url_assert_for_element_click(element)
                if url_line:
                    describe_lines.append(f"    {url_line}")
                describe_lines.append("    await expect(page).toHaveTitle(/.+/);")
                clicks_written += 1

    if clicks_written == 0 and nav_links:
        describe_lines.append("    for (const link of NAV_LINKS) {")
        describe_lines.append(f"      await page.goto('{start_path or '/'}')")
        describe_lines.append(
            "      await page.getByRole('link', { name: link.label, exact: true }).first().click();"
        )
        for line in map_assertions_for_nav_loop(
            case.get("assertions", ["page_loads"])
        ):
            describe_lines.append(f"      {line}")
        describe_lines.append("    }")
    elif clicks_written == 0:
        for line in map_assertions(case.get("assertions", ["page_loads"])):
            describe_lines.append(f"    {line}")

    return clicks_written


def _resolve_home_nav_element(
    contract: Contract,
    home_page: dict | None,
    norm: dict[str, str],
) -> dict | None:
    """Resolve a home-page element for a structured nav link (skip off-home targets)."""
    home_page = home_page or contract.get_page("home")
    if not home_page:
        return None

    eid = norm.get("element_id")
    label = (norm.get("label") or "").strip()
    route = norm.get("route", "/")

    if eid:
        for el in home_page.get("elements", []):
            if el.get("element_id") == eid:
                return el

    if label:
        matches = [
            el
            for el in home_page.get("elements", [])
            if (el.get("label") or "").strip().lower() == label.lower()
        ]
        link_matches = [el for el in matches if el.get("role") == "link"]
        if link_matches:
            return link_matches[0]
        if matches:
            return matches[0]

    if route and route != "/":
        from urllib.parse import urlparse

        for el in home_page.get("elements", []):
            if el.get("role") != "link":
                continue
            href = el.get("href") or ""
            tp = el.get("target_path") or ""
            if tp and tp.rstrip("/") == route.rstrip("/"):
                return el
            if href:
                parsed = urlparse(href)
                path = (parsed.path or "/") + (
                    f"#{parsed.fragment}" if parsed.fragment else ""
                )
                if path == route or href.endswith(route):
                    return el
    return None


def _href_locator_suffix(el: dict) -> str | None:
    from urllib.parse import urlparse

    href = el.get("href") or ""
    if not href:
        return None
    parsed = urlparse(href)
    if parsed.fragment and (not parsed.path or parsed.path in ("", "/")):
        return f"#{parsed.fragment}"
    if parsed.path and parsed.path not in ("", "/"):
        return parsed.path
    return None


def _click_expr_for_nav_element(el: dict, route: str) -> str | None:
    suffix = _href_locator_suffix(el)
    label = _escape_ts_string(el.get("label", ""))
    role = el.get("role", "link")

    if suffix and role == "link":
        if suffix.startswith("#"):
            loc = f"page.locator('a[href$=\"{suffix}\"], a[href*=\"{suffix}\"]')"
        else:
            loc = f"page.locator('a[href=\"{suffix}\"], a[href$=\"{suffix}\"]')"
        if label:
            loc = (
                f"{loc}.or(page.getByRole('link', "
                f"{{ name: '{label}', exact: true }}))"
            )
        return f"{loc}.first().click()"

    if route and route != "/" and role == "link":
        route_esc = _escape_ts_string(route)
        loc = f"page.locator('a[href=\"{route_esc}\"], a[href$=\"{route_esc}\"]')"
        if label:
            loc = (
                f"{loc}.or(page.getByRole('link', "
                f"{{ name: '{label}', exact: true }}))"
            )
        return f"{loc}.first().click()"

    return _click_expr_for_element(el)


def _url_assert_from_contract(assert_meta: dict, route: str) -> str:
    kind = assert_meta.get("kind", "")
    value = _escape_ts_string(str(assert_meta.get("value", "")))
    if kind == "hash":
        return f"await expect(page).toHaveURL((url) => url.hash === '{value}');"
    if kind == "pathname":
        return (
            f"await expect(page).toHaveURL((url) => "
            f"url.pathname === '{value}' || url.pathname.startsWith('{value}'));"
        )
    if kind == "same_page":
        return "await expect(page).toHaveURL(/./);"
    route_esc = _escape_ts_string(route)
    return (
        f"await expect(page).toHaveURL((url) => "
        f"url.pathname === '{route_esc}' || url.pathname.startsWith('{route_esc}'));"
    )


def _url_assert_for_nav(route: str, el: dict | None, assert_meta: dict | None = None) -> str:
    if assert_meta:
        return _url_assert_from_contract(assert_meta, route)
    from urllib.parse import urlparse

    extras: list[str] = []
    if el:
        href = el.get("href") or ""
        frag = el.get("fragment") or (urlparse(href).fragment if href else "")
        if frag:
            extras.append(f"url.hash === '#{_escape_ts_string(frag)}'")
        tp = el.get("target_path") or ""
        if tp.startswith("/#"):
            extras.append(f"url.hash === '{_escape_ts_string(tp[1:])}'")

    extra_clause = f" || {' || '.join(extras)}" if extras else ""
    route_esc = _escape_ts_string(route)
    return (
        f"await expect(page).toHaveURL((url) => "
        f"url.pathname === '{route_esc}' || url.pathname.startsWith('{route_esc}')"
        f"{extra_clause});"
    )


def _click_expr_for_element(el: dict) -> str | None:
    xpath = el.get("selectors", {}).get("xpath", "")
    pw = el.get("selectors", {}).get("playwright", "")
    if pw:
        return f"{_normalize_playwright_selector(pw, page_var='page')}.first().click()"
    if xpath:
        return f"page.locator('xpath={_escape_ts_string(xpath)}').first().click()"
    label = el.get("label", "")
    role = el.get("role", "link")
    pw_role = {"link": "link", "button": "button", "input": "textbox"}.get(role, "button")
    if label:
        return (
            f"page.getByRole('{pw_role}', "
            f"{{ name: '{_escape_ts_string(label)}', exact: true }}).first().click()"
        )
    return None


def generate_spec(
    flow: dict,
    contract: Contract,
    yaml_path: Path,
    llm: LLMClient | None = None,
    use_llm_body: bool = False,
    use_llm_spec: bool = False,
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

    start_path = _resolve_start_path(flow, contract, module)
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
        flow_id = flow.get("flow_id", "FLOW-01")
        for case in flow.get("cases", []):
            case_id = case.get("id", "case")
            title = case.get("title", case_id)
            describe_lines.append(f"  test('{case_id}: {title}', async ({{ page }}) => {{")

            coverage = _case_element_coverage(case, contract)
            use_llm_for_case = use_llm_spec or coverage < COVERAGE_LLM_THRESHOLD
            refs_count = len([r for r in case.get("element_refs", []) if isinstance(r, dict)])

            if use_llm_for_case and refs_count > 0 and not _is_nav_case(case):
                slice_data = contract.slice_for_case(case)
                body = llm.complete(
                    spec_case_prompt(case, slice_data, pom_names, flow_id=flow_id),
                    temperature=0.2,
                    max_tokens=2000,
                )
                body = _sanitize_llm_body(body, _allowed_selectors(slice_data), contract, case)
                if body:
                    for line in body.splitlines():
                        describe_lines.append(f"  {line}" if line.startswith("test(") else f"    {line}")
                else:
                    _emit_deterministic_case_body(describe_lines, case, contract, start_path)
            else:
                _emit_deterministic_case_body(describe_lines, case, contract, start_path)

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
    use_llm_spec: bool = False,
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

    spec_content = generate_spec(
        flow_data, contract, yaml_path, llm=llm, use_llm_spec=use_llm_spec
    )
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
    use_llm_spec: bool = False,
) -> list[Path]:
    return generate_spec_for_plan(
        contract, app_slug, plan_id, llm=llm, use_llm_spec=use_llm_spec
    )


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
