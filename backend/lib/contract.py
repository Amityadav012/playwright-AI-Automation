"""Load and slice UI action contract JSON."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

SUPPORTED_CONTRACT_VERSION = "1.0.0"

MODULE_PAGE_TYPES: dict[str, set[str]] = {
    "auth": {"login"},
    "navigation": {"nav", "dashboard"},
    "content": {"list", "detail", "form", "settings", "error", "unknown"},
}

DEFAULT_MODULES = ("auth", "navigation", "content")


@dataclass
class Contract:
    raw: dict
    path: Path

    @property
    def version(self) -> str:
        return self.raw.get("contract_version", "")

    @property
    def app_name(self) -> str:
        return self.raw.get("application", {}).get("name", "app")

    @property
    def base_url(self) -> str:
        return self.raw.get("application", {}).get("base_url", "").rstrip("/")

    @property
    def route_index(self) -> list[dict]:
        return self.raw.get("route_index", [])

    @property
    def pages(self) -> list[dict]:
        return self.raw.get("pages", [])

    @property
    def scraped_at(self) -> str:
        return self.raw.get("extraction_metadata", {}).get("scraped_at", "")

    def validate(self) -> None:
        if self.version != SUPPORTED_CONTRACT_VERSION:
            raise ValueError(
                f"Unsupported contract_version {self.version!r}; "
                f"expected {SUPPORTED_CONTRACT_VERSION!r}"
            )
        if not self.base_url:
            raise ValueError("Contract missing application.base_url")

    def get_page(self, page_id: str) -> Optional[dict]:
        for page in self.pages:
            if page.get("page_id") == page_id:
                return page
        return None

    def pages_for_module(self, module: str) -> list[dict]:
        types = MODULE_PAGE_TYPES.get(module, set())
        matched = [p for p in self.pages if p.get("page_type") in types]
        if module == "content":
            matched = [
                p
                for p in self.pages
                if p.get("page_type") in types
                or p.get("page_id") in {"privacypolicy", "help", "faq", "screenreaderaccess"}
            ]
        if module == "navigation":
            matched = list({p["page_id"]: p for p in matched + self.pages if p.get("page_type") == "nav"}.values())
            sitemap = self.get_page("sitemap")
            if sitemap and sitemap not in matched:
                matched.append(sitemap)
        if module == "auth":
            login_pages = [p for p in self.pages if p.get("page_type") == "login" or p.get("page_id") == "home"]
            matched = list({p["page_id"]: p for p in login_pages}.values())
        return matched

    def slice_for_module(self, module: str, max_elements: int = 30) -> dict:
        pages = self.pages_for_module(module)
        slim_pages = []
        for page in pages:
            elements = page.get("elements", [])[:max_elements]
            slim_pages.append({
                "page_id": page.get("page_id"),
                "path": page.get("path"),
                "url": page.get("url"),
                "title": page.get("title"),
                "description": page.get("description"),
                "page_type": page.get("page_type"),
                "test_priority": page.get("test_priority"),
                "is_protected": page.get("is_protected"),
                "elements": [
                    {
                        "element_id": e.get("element_id"),
                        "role": e.get("role"),
                        "label": e.get("label"),
                        "description": e.get("description"),
                        "category": e.get("category"),
                        "target_path": e.get("target_path"),
                        "href": e.get("href"),
                        "selectors": e.get("selectors", {}),
                    }
                    for e in elements
                ],
                "forms": page.get("forms", []),
            })
        return {
            "contract_version": self.version,
            "application": self.raw.get("application", {}),
            "module": module,
            "route_index": [
                r for r in self.route_index
                if any(r.get("page_id") == p.get("page_id") for p in slim_pages)
            ],
            "pages": slim_pages,
        }

    def trim_for_prompt(self, max_pages: int = 8, max_elements: int = 20) -> dict:
        slim = []
        for page in self.pages[:max_pages]:
            slim.append({
                "page_id": page.get("page_id"),
                "path": page.get("path"),
                "title": page.get("title"),
                "page_type": page.get("page_type"),
                "test_priority": page.get("test_priority"),
                "description": page.get("description"),
                "elements": page.get("elements", [])[:max_elements],
                "forms": page.get("forms", []),
            })
        return {
            "application": self.raw.get("application", {}),
            "route_index": self.route_index,
            "pages": slim,
        }


def load_contract(path: str | Path) -> Contract:
    contract_path = Path(path)
    with contract_path.open(encoding="utf-8") as f:
        data = json.load(f)
    contract = Contract(raw=data, path=contract_path)
    contract.validate()
    return contract


def page_id_to_pom_name(page_id: str) -> str:
    parts = page_id.replace("-", "_").split("_")
    name = "".join(p.capitalize() for p in parts if p)
    return f"{name or 'Home'}Page"
