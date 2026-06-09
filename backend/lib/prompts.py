"""Versioned LLM prompt templates."""

import json
from typing import Any


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


def testcase_yaml_prompt(module: str, plan_markdown: str, contract_slice: dict) -> str:
    return f"""
You are generating YAML test case files for QA automation (E2E only).

Module: {module}

Test plan:
{plan_markdown}

Contract slice:
{json.dumps(contract_slice, indent=2)}

Return ONLY JSON (no markdown) with this shape:
{{
  "flows": [
    {{
      "module": "{module}",
      "flow_id": "AUTH-01",
      "flow_name": "snake_case_name",
      "priority": "P0",
      "type": ["e2e"],
      "tags": ["smoke", "regression"],
      "actors": ["public"],
      "environments": {{ "qa_ui": "${{QA_UI_BASE_URL}}" }},
      "ui_pages": ["HomePage"],
      "cases": [
        {{
          "id": "AUTH-01-H1",
          "title": "human readable",
          "type": "happy_path",
          "test_type": ["e2e"],
          "priority": "P0",
          "tags": ["smoke"],
          "preconditions": ["..."],
          "steps": ["..."],
          "assertions": ["page_title_visible"],
          "nav_links": [],
          "element_refs": [
            {{ "element_id": "...", "action": "click", "page_id": "home" }}
          ],
          "coverage_note": "why this case exists"
        }}
      ]
    }}
  ]
}}

Rules:
- One flow object per row in the plan's flow table
- Use semantic assertions: url_matches_route, page_title_visible, form_field_visible, login_button_clickable, link_visible, page_loads
- nav_links only for navigation flows; each entry needs label, route, page_id, element_id from contract
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
