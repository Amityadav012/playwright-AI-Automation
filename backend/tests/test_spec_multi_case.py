"""Tests for multi-case Playwright spec generation."""

from __future__ import annotations

from pathlib import Path

import pytest

from generators.spec_generator import generate_spec
from lib.contract import load_contract

FIXTURE = Path(__file__).parent / "fixtures" / "nav_contract.json"


@pytest.fixture
def contract():
    return load_contract(FIXTURE)


def _nav_flow_multi_case() -> dict:
    return {
        "module": "navigation",
        "flow_id": "plan-nav",
        "flow_name": "header_nav",
        "tags": ["smoke"],
        "actors": ["public"],
        "ui_pages": ["HomePage"],
        "cases": [
            {
                "id": "plan-nav-H1",
                "title": "Help link",
                "nav_links": [{
                    "element_id": "help_link",
                    "label": "Help",
                    "route": "/help",
                    "assert": {"kind": "pathname", "value": "/help"},
                }],
                "element_refs": [{"element_id": "help_link", "action": "click", "page_id": "home"}],
            },
            {
                "id": "plan-nav-H2",
                "title": "Privacy link",
                "nav_links": [{
                    "element_id": "privacy_link",
                    "label": "Privacy policy",
                    "route": "/privacypolicy",
                    "assert": {"kind": "pathname", "value": "/privacypolicy"},
                }],
                "element_refs": [{"element_id": "privacy_link", "action": "click", "page_id": "home"}],
            },
            {
                "id": "plan-nav-H3",
                "title": "FAQ hash",
                "nav_links": [{
                    "element_id": "faq_hash",
                    "label": "FAQ",
                    "route": "/#faq",
                    "assert": {"kind": "hash", "value": "#faq"},
                }],
                "element_refs": [{"element_id": "faq_hash", "action": "click", "page_id": "home"}],
            },
        ],
    }


def test_multi_case_emits_three_tests(contract):
    flow = _nav_flow_multi_case()
    spec = generate_spec(flow, contract, Path("case.yaml"), use_llm_spec=False)
    assert spec.count("test('plan-nav-H") == 3
    assert "toHaveURL" in spec
    assert "url.hash === '#faq'" in spec or "hash" in spec


def test_nav_case_uses_contract_asserts_not_module_label(contract):
    """Mislabeled module: content — nav_links still drive nav loop."""
    flow = _nav_flow_multi_case()
    flow["module"] = "content"
    spec = generate_spec(flow, contract, Path("case.yaml"), use_llm_spec=False)
    assert spec.count("test('plan-nav-H") == 3
    assert "getByRole('link', { name: 'Help' })" in spec
    assert "pathname === '/help'" in spec or "/help" in spec


def test_full_nav_case_matches_home_navigation_count(contract):
    """Integration-style: validated single nav case → spec clicks match home_navigation."""
    from lib.contract_validate import validate_flow

    flow = {
        "module": "content",
        "flow_id": "plan-8ccab92d",
        "flow_name": "header_nav",
        "tags": ["smoke"],
        "actors": ["public"],
        "ui_pages": ["HomePage"],
        "cases": [{
            "title": "All header links",
            "nav_links": [{"element_id": "bogus", "label": "Fake"}],
        }],
    }
    meta = {"module": "navigation", "user_intent": "verify all nav links in header"}
    validated, _ = validate_flow(flow, contract, meta)
    assert len(validated["cases"]) == 1
    assert len(validated["cases"][0]["nav_links"]) == len(contract.home_navigation)

    spec = generate_spec(validated, contract, Path("case.yaml"), use_llm_spec=False)
    assert spec.count("test('plan-8ccab92d-H1") == 1
    assert spec.count(".click()") >= len(contract.home_navigation)
    assert spec.count("toHaveURL") >= len(contract.home_navigation)


def test_assertions_hash_pathname():
    from lib.assertions import assert_line_from_contract

    hash_line = assert_line_from_contract({"kind": "hash", "value": "#faq"})
    assert "url.hash === '#faq'" in hash_line

    path_line = assert_line_from_contract({"kind": "pathname", "value": "/help"})
    assert "pathname === '/help'" in path_line
