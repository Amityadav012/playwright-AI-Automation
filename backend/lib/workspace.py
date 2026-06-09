"""App workspace registry for plan → testcase → spec hierarchy."""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from lib.artifacts import CASE_SPEC_NAME, CASE_YAML_NAME
from lib.paths import app_output_dir, contracts_dir, ensure_app_dirs

WORKSPACE_FILE = "workspace.json"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def workspace_path(app_slug: str) -> Path:
    return app_output_dir(app_slug) / WORKSPACE_FILE


def resolve_contract_path(app_slug: str, filename: str | None = None) -> Path:
    name = filename or f"{app_slug}-contract.json"
    return contracts_dir() / name


def load_workspace(app_slug: str) -> dict[str, Any]:
    ensure_app_dirs(app_slug)
    path = workspace_path(app_slug)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))

    contract = resolve_contract_path(app_slug)
    data = {
        "app_slug": app_slug,
        "contract_path": str(contract) if contract.exists() else None,
        "plans": [],
    }
    save_workspace(app_slug, data)
    return data


def save_workspace(app_slug: str, data: dict[str, Any]) -> Path:
    path = workspace_path(app_slug)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return path


def _read_testcase_entry(root: Path, plan_id: str, yaml_file: Path) -> dict[str, str]:
    title = ""
    try:
        import yaml

        data = yaml.safe_load(yaml_file.read_text(encoding="utf-8")) or {}
        cases = data.get("cases") or []
        if cases:
            title = cases[0].get("title", "")
    except Exception:
        pass
    return {
        "flow_id": plan_id,
        "path": str(yaml_file.relative_to(root)),
        "title": title,
    }


def _sync_testcases_for_plan(root: Path, plan: dict[str, Any]) -> list[dict[str, str]]:
    plan_id = plan.get("id", "")
    case_dir = root / "tests" / "testcases" / plan_id
    if not case_dir.exists():
        return []

    canonical = case_dir / CASE_YAML_NAME
    if canonical.exists():
        return [_read_testcase_entry(root, plan_id, canonical)]

    legacy = sorted(case_dir.glob("*.yaml"))
    if legacy:
        return [_read_testcase_entry(root, plan_id, legacy[0])]
    return []


def _sync_specs_for_plan(root: Path, plan: dict[str, Any]) -> list[dict[str, str]]:
    plan_id = plan.get("id", "")
    spec_dir = root / "tests" / "scripts" / "e2e" / plan_id
    if not spec_dir.exists():
        return []

    canonical = spec_dir / CASE_SPEC_NAME
    if canonical.exists():
        return [{"flow_id": plan_id, "path": str(canonical.relative_to(root))}]

    legacy = sorted(spec_dir.glob("*.e2e.spec.ts"))
    if legacy:
        return [{"flow_id": plan_id, "path": str(legacy[0].relative_to(root))}]
    return []


def sync_plans_from_disk(app_slug: str) -> dict[str, Any]:
    """Merge plan/testcase/spec artifacts from disk into workspace registry."""
    ws = load_workspace(app_slug)
    root = app_output_dir(app_slug)
    plan_dir = root / "tests" / "testplan"
    changed = False

    known_ids = {p.get("id") for p in ws.get("plans", [])}
    if plan_dir.exists():
        for plan_file in sorted(plan_dir.glob("plan-*.md")):
            plan_id = plan_file.stem
            if plan_id in known_ids:
                continue
            meta = parse_plan_frontmatter(plan_file)
            rel = str(plan_file.relative_to(root))
            ws["plans"].append({
                "id": plan_id,
                "user_intent": meta.get("user_intent", plan_id),
                "plan_path": rel,
                "created_at": meta.get("created_at") or _utc_now(),
                "testcases": [],
                "specs": [],
            })
            known_ids.add(plan_id)
            changed = True

    for plan in ws.get("plans", []):
        testcases = _sync_testcases_for_plan(root, plan)
        specs = _sync_specs_for_plan(root, plan)
        if testcases != plan.get("testcases"):
            plan["testcases"] = testcases
            changed = True
        if specs != plan.get("specs"):
            plan["specs"] = specs
            changed = True

    if changed:
        save_workspace(app_slug, ws)
    return ws


def ensure_workspace(app_slug: str, contract_path: str | None = None) -> dict[str, Any]:
    ws = sync_plans_from_disk(app_slug)
    if contract_path:
        ws["contract_path"] = contract_path
        save_workspace(app_slug, ws)
    return ws


def new_plan_id() -> str:
    return f"plan-{uuid.uuid4().hex[:8]}"


def add_plan(
    app_slug: str,
    plan_id: str,
    user_intent: str,
    plan_path: str,
) -> dict[str, Any]:
    ws = load_workspace(app_slug)
    ws["plans"] = [p for p in ws.get("plans", []) if p.get("id") != plan_id]
    ws["plans"].append({
        "id": plan_id,
        "user_intent": user_intent,
        "plan_path": plan_path,
        "created_at": _utc_now(),
        "testcases": [],
        "specs": [],
    })
    save_workspace(app_slug, ws)
    return ws


def get_plan(app_slug: str, plan_id: str) -> dict[str, Any] | None:
    ws = load_workspace(app_slug)
    for plan in ws.get("plans", []):
        if plan.get("id") == plan_id:
            return plan
    return None


def register_testcases(
    app_slug: str,
    plan_id: str,
    entries: list[dict[str, str]],
) -> dict[str, Any]:
    ws = load_workspace(app_slug)
    for plan in ws.get("plans", []):
        if plan.get("id") == plan_id:
            plan["testcases"] = entries
            break
    save_workspace(app_slug, ws)
    return ws


def register_spec(
    app_slug: str,
    plan_id: str,
    flow_id: str,
    spec_path: str,
) -> dict[str, Any]:
    ws = load_workspace(app_slug)
    for plan in ws.get("plans", []):
        if plan.get("id") == plan_id:
            plan["specs"] = [{"flow_id": plan_id, "path": spec_path}]
            break
    save_workspace(app_slug, ws)
    return ws


def parse_plan_frontmatter(plan_path: Path) -> dict[str, str]:
    text = plan_path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not match:
        return {"module": plan_path.stem, "user_intent": "", "plan_id": plan_path.stem}
    meta: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, _, val = line.partition(":")
            meta[key.strip()] = val.strip()
    return meta


def plan_markdown_body(plan_path: Path) -> str:
    text = plan_path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n.*?\n---\s*\n", text, re.DOTALL)
    return text[match.end():] if match else text
