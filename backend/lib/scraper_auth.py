"""Playwright auth execution for the website scraper."""

from __future__ import annotations

import logging
import re
import time
from typing import TYPE_CHECKING, Any
from urllib.parse import urlparse

from lib.scraper_credentials import (
    FILLABLE_KEYS,
    available_fillable_keys,
    has_auth_credentials,
    navigation_timeout_ms,
)

if TYPE_CHECKING:
    from playwright.sync_api import Page

    from scraper import WebScraper

log = logging.getLogger(__name__)

LOGIN_PATH_RE = re.compile(r"/(?:login|signin|sign-in|auth)(?:/|$)", re.IGNORECASE)
AUTH_FIELD_HINTS = (
    "otp",
    "mobile",
    "phone",
    "email",
    "username",
    "password",
    "userid",
    "user_id",
)

# Fuzzy label hints — matched only against controls discovered on the current page.
CREDENTIAL_AFFINITY: dict[str, tuple[tuple[str, int], ...]] = {
    "QA_PASSWORD": (("password", 10),),
    "QA_USERNAME": (("username", 9), ("email", 8), ("user id", 7), ("userid", 7), ("login id", 6)),
    "QA_TEST_MOBILE": (("mobile", 10), ("phone", 9), ("tel", 8), ("contact", 7), ("cell", 6)),
    "QA_TEST_OTP": (
        ("otp", 10),
        ("one-time", 9),
        ("one time", 9),
        ("verification", 8),
        ("verify code", 8),
        ("pin", 6),
        ("passcode", 6),
    ),
}
INTERMEDIATE_ACTION_HINTS = (
    "send",
    "request",
    "get",
    "resend",
    "generate",
    "continue",
    "next",
    "proceed",
)
SUBMIT_ACTION_HINTS = ("login", "sign in", "signin", "verify", "submit", "enter", "confirm")


def is_login_path(url: str) -> bool:
    return bool(LOGIN_PATH_RE.search(urlparse(url).path or ""))


def forms_have_auth_fields(forms: list[dict]) -> bool:
    for form in forms:
        for field in form.get("fields", []):
            field_type = (field.get("type") or "").lower()
            if field_type == "password":
                return True
            haystack = _label_haystack(field)
            if any(hint in haystack for hint in AUTH_FIELD_HINTS):
                return True
    return False


def is_login_gate(url: str, page_type: str, forms: list[dict]) -> bool:
    if page_type == "login":
        return True
    if is_login_path(url):
        return True
    return forms_have_auth_fields(forms)


def auth_success(page_url: str, page_type: str) -> bool:
    return not is_login_path(page_url) and page_type != "login"


def _label_haystack(item: dict) -> str:
    return " ".join(
        str(item.get(key) or "")
        for key in ("label", "name", "placeholder", "aria_label", "field_id", "text")
    ).lower()


def _selector_from_playwright(pw: str) -> str | None:
    if not pw:
        return None
    text = pw.strip()
    for prefix in ("page.locator(", "page.getByRole(", "page.getByLabel(", "page.getByPlaceholder("):
        if text.startswith(prefix):
            inner = text[len(prefix) :].rstrip(")").strip()
            if inner.startswith(("'", '"')):
                quote = inner[0]
                end = inner.index(quote, 1)
                return inner[1:end]
            return inner
    if text.startswith("page."):
        return None
    return text


def _selector_for_control(item: dict) -> str | None:
    selectors = item.get("selectors") or {}
    selector = _selector_from_playwright(selectors.get("playwright") or "")
    if selector:
        return selector
    name = item.get("name")
    if name:
        return f"[name='{name}']"
    field_id = item.get("field_id")
    if field_id:
        return f"#{field_id}"
    return None


def _score_field_for_credential(field: dict, credential_key: str) -> int:
    haystack = _label_haystack(field)
    field_type = (field.get("type") or "").lower()
    score = 0
    if credential_key == "QA_PASSWORD" and field_type == "password":
        score = max(score, 12)
    if credential_key == "QA_TEST_MOBILE" and field_type in ("tel", "number"):
        score = max(score, 11)
    for hint, weight in CREDENTIAL_AFFINITY.get(credential_key, ()):
        if hint in haystack:
            score = max(score, weight)
    return score


def _collect_fields(forms: list[dict]) -> list[dict]:
    fields: list[dict] = []
    for form in forms:
        fields.extend(form.get("fields", []))
    return fields


def _match_credentials_to_fields(
    fields: list[dict],
    available_keys: list[str],
) -> list[tuple[dict, str]]:
    """Map discovered fields to env credential keys in DOM order."""
    pairs: list[tuple[dict, str]] = []
    used_keys: set[str] = set()
    for field in fields:
        best_key: str | None = None
        best_score = 0
        for key in available_keys:
            if key in used_keys:
                continue
            score = _score_field_for_credential(field, key)
            if score > best_score:
                best_score = score
                best_key = key
        if best_key and best_score > 0 and _selector_for_control(field):
            pairs.append((field, best_key))
            used_keys.add(best_key)
    return pairs


def _button_selector_from_element(element: dict) -> str | None:
    selectors = element.get("selectors") or {}
    selector = _selector_from_playwright(selectors.get("playwright") or "")
    if selector and not selector.startswith("page."):
        return selector
    field_id = element.get("field_id")
    if field_id:
        return f"#{field_id}"
    name = element.get("name")
    if name:
        return f"[name='{name}']"
    label = (element.get("label") or element.get("text") or "").strip()
    if not label:
        return None
    escaped = label.replace("'", "\\'")
    tag = element.get("tag") or "button"
    if tag == "a":
        return f"a:has-text('{escaped}')"
    return f"button:has-text('{escaped}'), input[type='submit']:has-text('{escaped}')"


def _find_button_by_hints(elements: list[dict], hints: tuple[str, ...]) -> str | None:
    for element in elements:
        if element.get("role") not in ("button", "link", None) and element.get("tag") not in (
            "button",
            "input",
            "a",
        ):
            continue
        haystack = _label_haystack(element)
        if any(hint in haystack for hint in hints):
            selector = _button_selector_from_element(element)
            if selector:
                return selector
    return None


def extract_live_auth_controls(page: Page) -> tuple[list[dict], list[dict]]:
    """Read inputs and buttons from the live DOM (SPA-friendly, app-agnostic)."""
    raw = page.evaluate(
        """() => {
        const fields = [];
        for (const el of document.querySelectorAll('input, textarea, select')) {
            const type = (el.type || 'text').toLowerCase();
            if (type === 'hidden' || type === 'submit' || type === 'button') continue;
            fields.push({
                type,
                name: el.name || '',
                field_id: el.id || '',
                label: (el.labels && el.labels[0] ? el.labels[0].innerText : '') || el.getAttribute('aria-label') || '',
                placeholder: el.placeholder || '',
            });
        }
        const buttons = [];
        const pushButton = (el) => {
            const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim();
            if (!text) return;
            buttons.push({
                tag: el.tagName.toLowerCase(),
                role: 'button',
                label: text.slice(0, 120),
                name: el.name || '',
                field_id: el.id || '',
            });
        };
        document.querySelectorAll('button, input[type=submit], input[type=button]').forEach(pushButton);
        document.querySelectorAll('a[role=button]').forEach(pushButton);
        return { fields, buttons };
    }"""
    )
    live_forms = [{"fields": raw.get("fields", [])}] if raw.get("fields") else []
    live_elements = raw.get("buttons", [])
    return live_forms, live_elements


def fallback_auth_plan(
    forms: list[dict],
    elements: list[dict],
    credentials: dict[str, str],
    *,
    page: Page | None = None,
) -> dict[str, Any]:
    """Build auth steps only from controls discovered on the page (static HTML + live DOM)."""
    available_keys = available_fillable_keys(credentials)
    if not available_keys:
        return {"flow_type": "unknown", "steps": [], "success_hint": "url_path_not_login"}

    merged_forms = list(forms)
    merged_elements = list(elements)
    if page is not None:
        live_forms, live_elements = extract_live_auth_controls(page)
        merged_forms.extend(live_forms)
        merged_elements.extend(live_elements)

    field_pairs = _match_credentials_to_fields(_collect_fields(merged_forms), available_keys)
    if not field_pairs:
        return {"flow_type": "unknown", "steps": [], "success_hint": "url_path_not_login"}

    steps: list[dict[str, Any]] = []
    keys_in_order = [key for _field, key in field_pairs]
    needs_intermediate_action = (
        "QA_TEST_MOBILE" in keys_in_order and "QA_TEST_OTP" in keys_in_order
    )

    for index, (field, credential_key) in enumerate(field_pairs):
        if (
            needs_intermediate_action
            and credential_key == "QA_TEST_OTP"
            and "QA_TEST_MOBILE" in keys_in_order[:index]
        ):
            intermediate = _find_button_by_hints(merged_elements, INTERMEDIATE_ACTION_HINTS)
            if intermediate:
                steps.append({"action": "click", "selector": intermediate})
                steps.append({"wait_ms": 2000})

        selector = _selector_for_control(field)
        if selector:
            steps.append(
                {"action": "fill", "selector": selector, "credential_key": credential_key}
            )

    submit_selector = _find_button_by_hints(merged_elements, SUBMIT_ACTION_HINTS)
    if submit_selector:
        steps.append({"action": "click", "selector": submit_selector})

    flow_type = (
        "otp"
        if {"QA_TEST_MOBILE", "QA_TEST_OTP"} <= set(available_keys)
        else "password"
        if {"QA_USERNAME", "QA_PASSWORD"} <= set(available_keys)
        else "mixed"
    )
    return {
        "flow_type": flow_type,
        "steps": steps,
        "success_hint": "url_path_not_login_or_dashboard",
    }


def execute_auth_plan(page: Page, plan: dict[str, Any], credentials: dict[str, str]) -> bool:
    steps = plan.get("steps") or []
    if not steps:
        return False

    for step in steps:
        if step.get("wait_ms"):
            time.sleep(max(0, int(step["wait_ms"])) / 1000.0)
            continue

        action = step.get("action")
        selector = step.get("selector")
        if not selector:
            log.warning("Auth step missing selector: %s", step)
            return False

        if action == "fill":
            key = step.get("credential_key")
            if key not in FILLABLE_KEYS:
                log.warning("Auth fill step has invalid credential_key: %s", key)
                return False
            value = credentials.get(key or "")
            if not value:
                log.warning("Missing credential value for %s", key)
                return False
            page.locator(selector).first.fill(value)
        elif action == "click":
            page.locator(selector).first.click()
        else:
            log.warning("Unknown auth step action: %s", action)
            return False

    try:
        page.wait_for_load_state("domcontentloaded", timeout=navigation_timeout_ms())
    except Exception as exc:
        log.warning("Auth wait after steps failed: %s", exc)
    return True


def authenticate_page(
    scraper: WebScraper,
    page: Page,
    *,
    url: str,
    title: str,
    page_text: str,
    analysis: dict[str, Any],
    forms: list[dict],
    elements: list[dict],
) -> bool:
    if scraper.authenticated:
        return True
    if scraper._auth_attempted:
        return False
    if not has_auth_credentials(scraper.credentials):
        return False

    scraper._auth_attempted = True
    available_keys = available_fillable_keys(scraper.credentials)
    if not available_keys:
        return False

    log.info("Planning authentication for %s (keys: %s)", url, ", ".join(available_keys))
    plan = scraper.llm.plan_auth_steps(
        url=url,
        title=title,
        page_text=page_text,
        forms=forms,
        elements=elements,
        available_keys=available_keys,
    )
    if not plan.get("steps"):
        plan = fallback_auth_plan(
            forms,
            elements,
            scraper.credentials,
            page=page,
        )
        if plan.get("steps"):
            log.info(
                "Using page-derived fallback auth plan (%d steps, flow=%s)",
                len(plan["steps"]),
                plan.get("flow_type", "unknown"),
            )

    if not plan.get("steps"):
        log.warning("No auth steps produced for %s", url)
        return False

    try:
        if not execute_auth_plan(page, plan, scraper.credentials):
            return False
        if auth_success(page.url, "unknown"):
            scraper.authenticated = True
            log.info("Authentication succeeded at %s", page.url)
            return True
        log.warning("Authentication steps ran but still on login-like page: %s", page.url)
    except Exception as exc:
        log.warning("Authentication failed for %s: %s", url, exc)
    return False


def authenticate_at_url(scraper: WebScraper, page: Page, url: str) -> bool:
    """Load a URL and run the auth planner/executor once."""
    if scraper.authenticated:
        return True

    from scraper import (
        build_contract_forms,
        build_unified_elements,
        extract_clickables,
        extract_links_from_page,
    )
    from bs4 import BeautifulSoup

    try:
        page.goto(url, wait_until="domcontentloaded", timeout=navigation_timeout_ms())
        time.sleep(scraper.delay)
    except Exception as exc:
        log.warning("Failed to open auth URL %s: %s", url, exc)
        return False

    html = page.content()
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.string.strip() if soup.title else url
    page_text = soup.get_text(separator=" ", strip=True)
    page_links = extract_links_from_page(page, url, scraper.base_domain)
    clickables, raw_forms = extract_clickables(soup, url)
    analysis = scraper.llm.analyze_page(url, title, page_text, clickables)
    elements = build_unified_elements(page_links, clickables, scraper.base_url)
    contract_forms = build_contract_forms(raw_forms, scraper.base_url)

    return authenticate_page(
        scraper,
        page,
        url=url,
        title=title,
        page_text=page_text,
        analysis=analysis,
        forms=contract_forms,
        elements=elements,
    )
