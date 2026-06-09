"""
Test Case Generator
-----------------
Test plan Markdown + contract → YAML testcases per flow.
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

from lib.contract import Contract, load_contract, page_id_to_pom_name
from lib.llm import LLMClient
from lib.overlap import check_overlaps, extract_flow_ids_from_plan
from lib.paths import ensure_app_dirs
from lib.prompts import testcase_yaml_prompt

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


def _normalize_flow(flow: dict[str, Any], module: str) -> dict[str, Any]:
    flow = dict(flow)
    flow["module"] = flow.get("module") or module
    flow.setdefault("type", ["e2e"])
    flow.setdefault("tags", ["regression"])
    flow.setdefault("actors", ["public"])
    flow.setdefault("environments", {"qa_ui": "${QA_UI_BASE_URL}"})

    ui_pages = flow.get("ui_pages") or []
    normalized_pages = []
    for name in ui_pages:
        if name.endswith("Page"):
            normalized_pages.append(name)
        else:
            normalized_pages.append(page_id_to_pom_name(name.replace("Page", "").lower()))
    flow["ui_pages"] = normalized_pages

    cases = []
    for case in flow.get("cases", []):
        case = dict(case)
        case.setdefault("test_type", ["e2e"])
        case.setdefault("type", "happy_path")
        case.setdefault("tags", flow.get("tags", ["regression"]))
        cases.append(case)
    flow["cases"] = cases
    return flow


def generate_testcases_for_plan(
    contract: Contract,
    app_slug: str,
    plan_path: Path,
    llm: LLMClient | None = None,
    skip_overlap: bool = False,
) -> list[Path]:
    llm = llm or LLMClient()
    root = ensure_app_dirs(app_slug)
    module = plan_path.stem
    plan_text = plan_path.read_text(encoding="utf-8")

    existing_ids: set[str] = set()
    if not skip_overlap:
        proposed_ids = extract_flow_ids_from_plan(plan_text)
        report = check_overlaps(proposed_ids, root / "tests" / "testcases")
        existing_ids = set(report.get("exact_duplicates", []))

    slice_data = contract.slice_for_module(module)
    prompt = testcase_yaml_prompt(module, plan_text, slice_data)
    result = llm.complete_json(prompt, temperature=0.0, max_tokens=4000)

    flows = result.get("flows", [])
    if not flows:
        raise ValueError(f"LLM returned no flows for plan {plan_path}")

    out_dir = root / "tests" / "testcases" / module
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    for flow in flows:
        flow = _normalize_flow(flow, module)
        flow_id = flow.get("flow_id")
        if not flow_id:
            log.warning("Skipping flow without flow_id")
            continue
        if flow_id in existing_ids:
            log.info("  Skipping duplicate flow %s (already in testcases/)", flow_id)
            continue
        out_path = out_dir / f"{flow_id}.yaml"
        with out_path.open("w", encoding="utf-8") as f:
            yaml.dump(flow, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
        written.append(out_path)
        log.info("  Written: %s", out_path)

    return written


def generate_all_testcases(
    contract: Contract,
    app_slug: str,
    plan_dir: Path | None = None,
    llm: LLMClient | None = None,
) -> list[Path]:
    root = ensure_app_dirs(app_slug)
    plan_dir = plan_dir or (root / "tests" / "testplan")
    written: list[Path] = []
    for plan_path in sorted(plan_dir.glob("*.md")):
        log.info("Generating YAML from plan: %s", plan_path.name)
        written.extend(generate_testcases_for_plan(contract, app_slug, plan_path, llm=llm))
    return written


def main():
    parser = argparse.ArgumentParser(description="Generate YAML testcases from test plans + contract")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--app", required=True)
    parser.add_argument("--plan", help="Single plan file (default: all in output/{app}/tests/testplan/)")
    parser.add_argument("--skip-overlap", action="store_true")
    args = parser.parse_args()

    contract = load_contract(args.contract)
    root = ensure_app_dirs(args.app)

    if args.plan:
        plan_path = Path(args.plan)
        if not plan_path.is_absolute():
            plan_path = root / plan_path
        paths = generate_testcases_for_plan(
            contract, args.app, plan_path, skip_overlap=args.skip_overlap
        )
    else:
        paths = generate_all_testcases(contract, args.app)

    print(f"\nDone! {len(paths)} YAML file(s) written.")


if __name__ == "__main__":
    main()
