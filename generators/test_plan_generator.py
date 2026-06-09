"""
Test Plan Generator
-------------------
Contract JSON → Markdown test plans per module.
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

from dotenv import load_dotenv

from lib.contract import DEFAULT_MODULES, Contract, load_contract
from lib.llm import LLMClient
from lib.paths import ensure_app_dirs
from lib.prompts import test_plan_prompt

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


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
