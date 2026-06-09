"""
Test Plan Generator
-------------------
Contract JSON → Markdown test plans per module.
"""

from __future__ import annotations

import argparse
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from lib.contract import DEFAULT_MODULES, Contract, load_contract
from lib.llm import LLMClient
from lib.paths import ensure_app_dirs
from lib.prompts import test_plan_intent_prompt, test_plan_prompt
from lib.workspace import add_plan, new_plan_id

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


def infer_module_from_intent(user_intent: str) -> str:
    text = user_intent.lower()
    if re.search(r"\b(login|auth|sign.?in|otp|mobile|password|register)\b", text):
        return "auth"
    if re.search(r"\b(nav|menu|link|sitemap|route|header|footer)\b", text):
        return "navigation"
    return "content"


def slice_for_intent(contract: Contract, user_intent: str) -> tuple[str, dict]:
    module = infer_module_from_intent(user_intent)
    slice_data = contract.slice_for_module(module)
    if slice_data.get("pages"):
        return module, slice_data
    return module, contract.trim_for_prompt(max_pages=10, max_elements=25)


def generate_test_plan_for_intent(
    contract: Contract,
    app_slug: str,
    user_intent: str,
    llm: LLMClient | None = None,
) -> tuple[str, Path]:
    llm = llm or LLMClient()
    root = ensure_app_dirs(app_slug)
    plan_dir = root / "tests" / "testplan"
    plan_dir.mkdir(parents=True, exist_ok=True)

    plan_id = new_plan_id()
    module, slice_data = slice_for_intent(contract, user_intent)

    log.info("Generating intent-driven plan %s (module=%s)", plan_id, module)
    prompt = test_plan_intent_prompt(user_intent, slice_data, plan_id)
    markdown = llm.complete(prompt, temperature=0.2, max_tokens=2500)

    created_at = datetime.now(timezone.utc).isoformat()
    rel_path = f"tests/testplan/{plan_id}.md"
    out_path = root / rel_path
    frontmatter = (
        f"---\n"
        f"plan_id: {plan_id}\n"
        f"user_intent: {user_intent}\n"
        f"module: {module}\n"
        f"created_at: {created_at}\n"
        f"---\n\n"
    )
    header = f"# Test plan: {plan_id}\n\n"
    header += f"<!-- generated from {contract.path.name} | app: {contract.app_name} -->\n\n"
    out_path.write_text(frontmatter + header + markdown.strip() + "\n", encoding="utf-8")
    add_plan(app_slug, plan_id, user_intent, rel_path)
    log.info("  Written: %s", out_path)
    return plan_id, out_path


def generate_test_plans(
    contract: Contract,
    app_slug: str,
    modules: list[str] | None = None,
    llm: LLMClient | None = None,
) -> list[Path]:
    modules = modules or list(DEFAULT_MODULES)
    llm = llm or LLMClient()
    root = ensure_app_dirs(app_slug)
    plan_dir = root / "tests" / "testplan"
    written: list[Path] = []

    for module in modules:
        slice_data = contract.slice_for_module(module)
        if not slice_data.get("pages"):
            log.warning("No pages for module %s — skipping", module)
            continue

        log.info("Generating test plan for module: %s", module)
        prompt = test_plan_prompt(module, slice_data)
        markdown = llm.complete(prompt, temperature=0.2, max_tokens=2500)

        out_path = plan_dir / f"{module}.md"
        header = f"# Test plan: {module}\n\n"
        header += f"<!-- generated from {contract.path.name} | app: {contract.app_name} -->\n\n"
        out_path.write_text(header + markdown.strip() + "\n", encoding="utf-8")
        written.append(out_path)
        log.info("  Written: %s", out_path)

    return written


def main():
    parser = argparse.ArgumentParser(description="Generate Markdown test plans from UI contract")
    parser.add_argument("--contract", required=True, help="Path to UI action contract JSON")
    parser.add_argument("--app", required=True, help="App slug for output/{app}/")
    parser.add_argument(
        "--modules",
        default=",".join(DEFAULT_MODULES),
        help="Comma-separated modules (auth,navigation,content)",
    )
    args = parser.parse_args()

    contract = load_contract(args.contract)
    modules = [m.strip() for m in args.modules.split(",") if m.strip()]
    paths = generate_test_plans(contract, args.app, modules)
    print(f"\nDone! {len(paths)} test plan(s) written.")


if __name__ == "__main__":
    main()
