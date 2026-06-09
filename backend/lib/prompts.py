"""Versioned LLM prompt templates."""

import json
from typing import Any


def test_plan_intent_prompt(user_intent: str, contract_slice: dict, plan_id: str) -> str:
    return f"""
You are a senior QA engineer writing a focused E2E test plan for ONE user request.

Plan ID (use as the only Flow ID): {plan_id}

User wants to test:
{user_intent}

Use ONLY the UI contract slice below. Do not invent pages or elements not listed.

Contract slice:
{json.dumps(contract_slice, indent=2)}

Write a Markdown test plan with these sections exactly:
## Module purpose
## Actors
## Flows to test
(table: Flow ID | Description | Priority)
## Key assertions
## Per-flow notes

Rules:
- EXACTLY ONE row in the Flows to test table — flow ID must be `{plan_id}`
- EXACTLY ONE per-flow notes subsection for `{plan_id}`
- Consolidate the entire user intent into this single flow (e.g. all nav links = one flow, not one per link)
- Infer module (auth, navigation, or content) from the intent
- For homepage navigation intents: use ONLY entries from contract `home_navigation` when present — do not list routes from `route_index` that are not in `home_navigation`
- Priority P0
- Reference real element_id and form field_id values from the contract
- E2E only (no API or integration flows)
- Output ONLY Markdown body (no frontmatter, no fences)
"""


def test_plan_prompt(module: str, contract_slice: dict) -> str:
    return f"""
You are a senior QA engineer writing a test plan for module "{module}".

Use ONLY the UI contract slice below. Do not invent pages or elements not listed.

Contract slice:
{json.dumps(contract_slice, indent=2)}

Write a Markdown test plan with these sections exactly:
## Module purpose
## Actors
## Flows to test
(table: Flow ID | Description | Priority)
## Key assertions
## Per-flow notes
(one subsection per flow with page_id, path, element_id references)

Rules:
- Flow IDs for THIS module only: auth module → AUTH-01 only; navigation → NAV-01, NAV-02; content → CONTENT-01 only
- Do NOT include flows that belong to other modules
- Priority P0 for login and primary nav, P1 for secondary content
- Reference real element_id and form field_id values from the contract
- E2E only (no API or integration flows)
- Output ONLY Markdown, no fences
"""


def testcase_yaml_prompt(
    module: str,
    plan_markdown: str,
    contract_slice: dict,
    user_intent: str = "",
    plan_id: str = "",
) -> str:
    intent_block = f"\nUser test intent:\n{user_intent}\n" if user_intent else ""
    flow_id = plan_id or "FLOW-01"
    return f"""
You are generating ONE YAML test case for QA automation (E2E only).

Module: {module}
Plan ID / Flow ID (must use exactly): {flow_id}
{intent_block}
Test plan:
{plan_markdown}

Contract slice:
{json.dumps(contract_slice, indent=2)}

Return ONLY JSON (no markdown). The root object IS the flow (do not wrap in "flow" or "flows"):
{{
  "module": "{module}",
  "flow_id": "{flow_id}",
  "flow_name": "snake_case_name",
  "priority": "P0",
  "type": ["e2e"],
  "tags": ["smoke", "regression"],
  "actors": ["public"],
  "environments": {{ "qa_ui": "${{QA_UI_BASE_URL}}" }},
  "ui_pages": ["HomePage"],
  "cases": [
    {{
      "id": "{flow_id}-H1",
      "title": "human readable — covers full plan intent",
      "type": "happy_path",
      "test_type": ["e2e"],
      "priority": "P0",
      "tags": ["smoke"],
      "preconditions": ["..."],
      "steps": ["..."],
      "assertions": ["page_title_visible"],
      "nav_links": [
        {{ "label": "Home", "route": "/", "page_id": "home", "element_id": "home_2" }}
      ],
      "element_refs": [
        {{ "element_id": "...", "action": "click", "page_id": "home" }}
      ],
      "coverage_note": "why this case exists"
    }}
  ]
}}

Rules:
- Return ONE flow only (not an array) — the entire plan maps to this single testcase
- flow_id MUST be `{flow_id}`
- cases array MUST have EXACTLY ONE case object covering the full plan intent
- For navigation intents: put ALL nav links in ONE case's nav_links array (do not split into multiple flows)
- When contract includes `home_navigation`, nav_links MUST match those entries only (same element_id / target_path)
- nav_links MUST be objects with label, route, and element_id — never plain strings
- page_id in element_refs must be contract page_id (e.g. home), not PascalCase (not HomePage)
- Use semantic assertions: url_matches_route, page_title_visible, form_field_visible, login_button_clickable, link_visible, page_loads
- element_refs must use real element_id values from contract
- ui_pages use PascalCase Page names (e.g. home -> HomePage)
"""


def spec_body_prompt(flow_yaml: dict, contract_slice: dict, pom_names: list[str]) -> str:
    return f"""
Generate the body of a Playwright TypeScript E2E spec (imports and describe wrapper exist).

Flow YAML:
{json.dumps(flow_yaml, indent=2)}

Contract slice:
{json.dumps(contract_slice, indent=2)}

POM classes available: {", ".join(pom_names)}

Rules:
- Output ONLY TypeScript test() blocks inside the describe (no imports, no describe wrapper)
- Use POM instances where possible
- Use selectors.playwright from contract element_refs when provided
- Tag each test with flow case id in the test name
- Use test.skip for auth flows when actor needs login and no fixture note says otherwise
- Do NOT use page.goto inside tests — assume beforeEach navigates
- Output ONLY code, no markdown fences
"""
