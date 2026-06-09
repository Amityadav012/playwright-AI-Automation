"""Output path helpers."""

from pathlib import Path

PIPELINE_VERSION = "1.0.0"
QA_AUTOMATION_ROOT = Path(__file__).resolve().parent.parent


def app_output_dir(app_slug: str) -> Path:
    return QA_AUTOMATION_ROOT / "output" / app_slug


def ensure_app_dirs(app_slug: str) -> Path:
    root = app_output_dir(app_slug)
    for sub in (
        "tests/testplan",
        "tests/testcases",
        "tests/scripts/e2e",
        "tests/scripts/pages",
        "tests/scripts/helpers",
        "tests/scripts/fixtures/auth",
    ):
        (root / sub).mkdir(parents=True, exist_ok=True)
    return root
