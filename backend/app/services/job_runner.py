from __future__ import annotations

import json
import logging
import threading
import traceback
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.schemas import JobResponse, JobResult, PipelineJobRequest
from lib.paths import contracts_dir, jobs_dir
from pipeline import run_pipeline

_log = logging.getLogger(__name__)

_lock = threading.Lock()
_active_job_id: str | None = None

TEXT_EXTENSIONS = {".md", ".yaml", ".yml", ".json", ".ts", ".txt", ".example"}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _job_dir(job_id: str) -> Path:
    path = jobs_dir() / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def _read_status(job_id: str) -> dict | None:
    status_path = _job_dir(job_id) / "status.json"
    if not status_path.exists():
        return None
    return json.loads(status_path.read_text(encoding="utf-8"))


def _write_status(job_id: str, data: dict) -> None:
    (_job_dir(job_id) / "status.json").write_text(
        json.dumps(data, indent=2), encoding="utf-8"
    )


def _attach_job_logger(job_id: str) -> logging.Handler:
    log_path = _job_dir(job_id) / "job.log"
    handler = logging.FileHandler(log_path, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    root = logging.getLogger()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    return handler


def _detach_job_logger(handler: logging.Handler) -> None:
    root = logging.getLogger()
    root.removeHandler(handler)
    handler.close()


def _normalize_steps(request: PipelineJobRequest) -> list[str]:
    steps = [s.strip() for s in request.steps if s.strip()]
    if "all" in steps:
        steps = ["plan", "yaml", "spec"]
    if request.url and "scrape" not in steps:
        steps = ["scrape"] + steps
    return steps


def _resolve_contract_path(request: PipelineJobRequest) -> str:
    filename = request.contract_filename or f"{request.app_slug}-contract.json"
    return str(contracts_dir() / filename)


def _run_job(job_id: str, request: PipelineJobRequest) -> None:
    global _active_job_id
    handler = _attach_job_logger(job_id)
    try:
        data = _read_status(job_id) or {}
        data["status"] = "running"
        data["started_at"] = _utc_now()
        _write_status(job_id, data)

        steps = _normalize_steps(request)
        contract_path = _resolve_contract_path(request)

        if "scrape" in steps and not request.url:
            raise ValueError("url is required when scrape step is enabled")

        result = run_pipeline(
            contract_path=contract_path,
            app_slug=request.app_slug,
            steps=steps,
            modules=request.modules,
            scrape_url=request.url,
            max_pages=request.max_pages,
        )

        data = _read_status(job_id) or {}
        data["status"] = "completed"
        data["finished_at"] = _utc_now()
        data["result"] = result
        _write_status(job_id, data)
        _log.info("Job %s completed", job_id)
    except Exception as exc:
        _log.error("Job %s failed: %s", job_id, exc)
        data = _read_status(job_id) or {}
        data["status"] = "failed"
        data["finished_at"] = _utc_now()
        data["error"] = str(exc)
        data["traceback"] = traceback.format_exc()
        _write_status(job_id, data)
    finally:
        _detach_job_logger(handler)
        with _lock:
            if _active_job_id == job_id:
                _active_job_id = None


def start_pipeline_job(request: PipelineJobRequest) -> JobResponse:
    global _active_job_id

    with _lock:
        if _active_job_id is not None:
            active = _read_status(_active_job_id)
            if active and active.get("status") in ("queued", "running"):
                raise RuntimeError(
                    f"Job {_active_job_id} is already running. Wait for it to finish."
                )
            _active_job_id = None

        job_id = uuid.uuid4().hex[:12]
        _active_job_id = job_id

    status = {
        "id": job_id,
        "status": "queued",
        "created_at": _utc_now(),
        "started_at": None,
        "finished_at": None,
        "app_slug": request.app_slug,
        "request": request.model_dump(),
        "result": None,
        "error": None,
    }
    _write_status(job_id, status)

    thread = threading.Thread(target=_run_job, args=(job_id, request), daemon=True)
    thread.start()

    return job_to_response(status)


def job_to_response(data: dict) -> JobResponse:
    result_data = data.get("result")
    result = None
    if result_data:
        result = JobResult(
            manifest=result_data.get("manifest"),
            steps_run=result_data.get("steps_run", []),
            flows=result_data.get("flows", []),
        )
    return JobResponse(
        id=data["id"],
        status=data["status"],
        created_at=data["created_at"],
        started_at=data.get("started_at"),
        finished_at=data.get("finished_at"),
        app_slug=data["app_slug"],
        request=PipelineJobRequest(**data["request"]),
        result=result,
        error=data.get("error"),
    )


def get_job(job_id: str) -> JobResponse | None:
    data = _read_status(job_id)
    if not data:
        return None
    return job_to_response(data)


def list_jobs(limit: int = 50) -> list[JobResponse]:
    root = jobs_dir()
    if not root.exists():
        return []

    jobs: list[JobResponse] = []
    for job_dir in sorted(root.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not job_dir.is_dir():
            continue
        data = _read_status(job_dir.name)
        if data:
            jobs.append(job_to_response(data))
        if len(jobs) >= limit:
            break
    return jobs


def read_job_logs(job_id: str, offset: int = 0) -> tuple[str, int, bool]:
    log_path = _job_dir(job_id) / "job.log"
    if not log_path.exists():
        return "", offset, True

    content = log_path.read_text(encoding="utf-8", errors="replace")
    if offset >= len(content):
        return "", offset, True
    return content[offset:], len(content), True
