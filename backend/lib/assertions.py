"""Map semantic YAML assertions to Playwright expect snippets."""

from __future__ import annotations

from typing import Any


ASSERTION_TEMPLATES: dict[str, str] = {
    "url_matches_route": "await expect(page).toHaveURL(new RegExp('{route_escaped}'));",
    "page_title_visible": "await expect(page.locator('h1').first()).toBeVisible();",
    "page_loads": "await expect(page).toHaveTitle(/.+/);",
    "link_visible": "await expect(page.getByRole('link', {{ name: '{label}' }})).toBeVisible();",
    "form_field_visible": "await expect(page.locator('{selector}')).toBeVisible();",
    "login_button_clickable": "await expect(page.getByRole('button', {{ name: 'Login' }})).toBeEnabled();",
    "header_title_visible": "await expect(page.locator('h1').first()).toContainText('{header}');",
}


def map_assertions(
    assertions: list[str],
    context: dict[str, Any] | None = None,
) -> list[str]:
    context = context or {}
    lines: list[str] = []
    for assertion in assertions:
        template = ASSERTION_TEMPLATES.get(assertion)
        if not template:
            lines.append(f"// TODO: assert {assertion}")
            continue
        line = template.format(
            route_escaped=context.get("route", "").replace("/", "\\/"),
            label=context.get("label", ""),
            selector=context.get("selector", "body"),
            header=context.get("header", ""),
        )
        lines.append(line)
    return lines
