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


def is_login_path(url: str) -> bool:
    return bool(LOGIN_PATH_RE.search(urlparse(url).path or ""))


def forms_have_auth_fields(forms: list[dict]) -> bool:
    for form in forms:
        for field in form.get("fields", []):
            field_type = (field.get("type") or "").lower()
            if field_type == "password":
                return True
            haystack = " ".join(
                [
                    str(field.get("name") or ""),
                    str(field.get("label") or ""),
                    str(field.get("placeholder") or ""),
                    str(field.get("field_id") or ""),
                ]
            ).lower()
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


def _selector_from_playwright(pw: str) -> str | None:
    if not pw:
        return None
    text = pw.strip()
    for prefix in ("page.locator(", "page.getByRole(", "page.getByLabel(", "page.getByPlaceholder("):
        if text.startswith(prefix):
            inner = text[len(prefix) :].rstrip(")").strip()
            if inner.startswith(("'", '"')):
                return inner[1 : inner.index(inner[0], 1)]
            return inner
    if text.startswith("page."):
        return None
    return text


def _field_selector(field: dict) -> str | None:
    selectors = field.get("selectors") or {}
    pw = selectors.get("playwright") or ""
    selector = _selector_from_playwright(pw)
    if selector:
        return selector
    name = field.get("name")
    if name:
        return f"[name='{name}']"
    field_id = field.get("field_id")
    if field_id:
        return f"#{field_id}"
    return None


def fallback_password_plan(
    forms: list[dict],
    credentials: dict[str, str],
    *,
    username_selector: str,
    password_selector: str,
    submit_selector: str,
) -> dict[str, Any]:
    if not (credentials.get("QA_USERNAME") and credentials.get("QA_PASSWORD")):
        return {"flow_type": "password", "steps": [], "success_hint": "url_path_not_login"}

    steps: list[dict[str, Any]] = []
    username_selector_used = False
    password_selector_used = False

    for form in forms:
        for field in form.get("fields", []):
            field_type = (field.get("type") or "").lower()
            selector = _field_selector(field)
            if not selector:
                continue
            haystack = " ".join(
                [
                    str(field.get("name") or ""),
                    str(field.get("label") or ""),
                    str(field.get("placeholder") or ""),
                ]
            ).lower()
            if field_type == "password" or "password" in haystack:
                steps.append(
                    {"action": "fill", "selector": selector, "credential_key": "QA_PASSWORD"}
                )
                password_selector_used = True
            elif any(k in haystack for k in ("email", "username", "user")):
                steps.append(
                    {"action": "fill", "selector": selector, "credential_key": "QA_USERNAME"}
                )
                username_selector_used = True
            elif field_type in ("tel", "number", "text") and credentials.get("QA_TEST_MOBILE"):
                if any(k in haystack for k in ("mobile", "phone", "otp")):
                    key = "QA_TEST_OTP" if "otp" in haystack else "QA_TEST_MOBILE"
                    steps.append({"action": "fill", "selector": selector, "credential_key": key})

    if not username_selector_used:
        steps.insert(
            0,
            {"action": "fill", "selector": username_selector, "credential_key": "QA_USERNAME"},
        )
    if not password_selector_used:
        steps.append(
            {"action": "fill", "selector": password_selector, "credential_key": "QA_PASSWORD"}
        )
    steps.append({"action": "click", "selector": submit_selector})
    return {
        "flow_type": "password",
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
        page.wait_for_load_state("domcontentloaded", timeout=15000)
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
        plan = fallback_password_plan(
            forms,
            scraper.credentials,
            username_selector=scraper.username_selector,
            password_selector=scraper.password_selector,
            submit_selector=scraper.submit_selector,
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
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
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
