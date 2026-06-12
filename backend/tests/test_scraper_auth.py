"""Tests for scraper env-backed authentication."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from lib.scraper_auth import (
    auth_success,
    execute_auth_plan,
    fallback_password_plan,
    forms_have_auth_fields,
    is_login_gate,
    is_login_path,
)
from lib.scraper_credentials import (
    available_fillable_keys,
    default_login_url,
    resolve_auth_url,
    has_auth_credentials,
    load_scraper_credentials,
    merge_legacy_cli_credentials,
)
from scraper import LLMAnalyzer


def test_load_scraper_credentials(monkeypatch):
    monkeypatch.setenv("QA_USERNAME", "user@example.com")
    monkeypatch.setenv("QA_PASSWORD", "secret")
    monkeypatch.delenv("QA_LOGIN_URL", raising=False)
    creds = load_scraper_credentials()
    assert creds["QA_USERNAME"] == "user@example.com"
    assert creds["QA_PASSWORD"] == "secret"
    assert "QA_LOGIN_URL" not in creds


def test_has_auth_credentials_requires_fillable_key():
    assert not has_auth_credentials({"QA_LOGIN_URL": "https://x.com/login"})
    assert has_auth_credentials({"QA_TEST_MOBILE": "9999999999"})


def test_default_login_url_only_from_env():
    creds = {"QA_LOGIN_URL": "https://app.test/login"}
    assert default_login_url(creds, "https://app.test") == "https://app.test/login"
    assert default_login_url({}, "https://app.test") is None


def test_resolve_auth_url_prefers_configured_login():
    creds = {"QA_LOGIN_URL": "https://app.test/login"}
    assert resolve_auth_url(creds, "https://app.test", "https://app.test/signin") == (
        "https://app.test/login"
    )
    assert resolve_auth_url({}, "https://app.test", "https://app.test/signin") == (
        "https://app.test/signin"
    )


def test_merge_legacy_cli_credentials():
    merged = merge_legacy_cli_credentials(
        {"QA_TEST_OTP": "123456"},
        login_url="https://app.test/signin",
        username="a@b.com",
        password="pw",
    )
    assert merged["QA_LOGIN_URL"] == "https://app.test/signin"
    assert merged["QA_USERNAME"] == "a@b.com"
    assert merged["QA_TEST_OTP"] == "123456"


@pytest.mark.parametrize(
    "path,expected",
    [
        ("https://app.test/login", True),
        ("https://app.test/sign-in", True),
        ("https://app.test/dashboard", False),
    ],
)
def test_is_login_path(path, expected):
    assert is_login_path(path) is expected


def test_is_login_gate_by_page_type():
    assert is_login_gate("https://app.test/home", "login", []) is True


def test_forms_have_auth_fields_detects_password():
    forms = [{"fields": [{"type": "password", "name": "password", "label": "Password"}]}]
    assert forms_have_auth_fields(forms) is True


def test_execute_auth_plan_runs_steps_in_order():
    page = MagicMock()
    plan = {
        "steps": [
            {"action": "fill", "selector": "#mobile", "credential_key": "QA_TEST_MOBILE"},
            {"wait_ms": 100},
            {"action": "fill", "selector": "#otp", "credential_key": "QA_TEST_OTP"},
            {"action": "click", "selector": "button[type=submit]"},
        ]
    }
    creds = {"QA_TEST_MOBILE": "9999999999", "QA_TEST_OTP": "123456"}
    assert execute_auth_plan(page, plan, creds) is True
    assert page.locator.return_value.first.fill.call_count == 2
    page.locator.return_value.first.click.assert_called_once()


def test_fallback_password_plan_uses_form_selectors():
    forms = [
        {
            "form_id": "login_form",
            "fields": [
                {
                    "field_id": "email",
                    "name": "email",
                    "type": "email",
                    "label": "Email",
                    "selectors": {"playwright": "page.locator('[name=\"email\"]')"},
                },
                {
                    "field_id": "password",
                    "name": "password",
                    "type": "password",
                    "label": "Password",
                    "selectors": {"playwright": "page.locator('[name=\"password\"]')"},
                },
            ],
        }
    ]
    plan = fallback_password_plan(
        forms,
        {"QA_USERNAME": "u", "QA_PASSWORD": "p"},
        username_selector="input[name=email]",
        password_selector="input[type=password]",
        submit_selector="button[type=submit]",
    )
    keys = [step.get("credential_key") for step in plan["steps"] if step.get("action") == "fill"]
    assert keys == ["QA_USERNAME", "QA_PASSWORD"]


def test_plan_auth_steps_uses_available_keys_only():
    analyzer = LLMAnalyzer()
    with patch.object(analyzer, "_run", return_value=json_plan_otp()) as mock_run:
        plan = analyzer.plan_auth_steps(
            url="https://app.test/login",
            title="Login",
            page_text="Enter mobile and OTP",
            forms=[
                {
                    "form_id": "otp_form",
                    "fields": [
                        {
                            "field_id": "mobile",
                            "name": "mobile",
                            "type": "tel",
                            "label": "Mobile",
                            "placeholder": "Mobile",
                            "selectors": {"playwright": "page.locator('[name=\"mobile\"]')"},
                        }
                    ],
                }
            ],
            elements=[{"element_id": "send_otp", "role": "button", "label": "Send OTP"}],
            available_keys=["QA_TEST_MOBILE", "QA_TEST_OTP"],
        )
    assert plan["flow_type"] == "otp"
    assert plan["steps"]
    prompt = mock_run.call_args[0][0]
    assert "QA_TEST_MOBILE" in prompt
    assert "9999999999" not in prompt


def json_plan_otp() -> str:
    import json

    return json.dumps(
        {
            "flow_type": "otp",
            "steps": [
                {"action": "fill", "selector": "[name='mobile']", "credential_key": "QA_TEST_MOBILE"},
                {"action": "click", "selector": "button.send-otp"},
                {"wait_ms": 1000},
                {"action": "fill", "selector": "[name='otp']", "credential_key": "QA_TEST_OTP"},
                {"action": "click", "selector": "button[type=submit]"},
            ],
            "success_hint": "url_path_not_login_or_dashboard",
        }
    )


def test_auth_success_after_redirect():
    assert auth_success("https://app.test/dashboard", "dashboard") is True
    assert auth_success("https://app.test/login", "unknown") is False


def test_available_fillable_keys():
    keys = available_fillable_keys(
        {"QA_USERNAME": "u", "QA_LOGIN_URL": "https://x", "QA_TEST_OTP": "1"}
    )
    assert keys == ["QA_USERNAME", "QA_TEST_OTP"]
