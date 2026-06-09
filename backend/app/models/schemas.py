from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

JobStatus = Literal["queued", "running", "completed", "failed"]
JobType = Literal["scrape", "plan", "testcase", "spec", "run", "pipeline"]


class ScrapeJobRequest(BaseModel):
    app_slug: str
    url: str
    contract_filename: str | None = None
    max_pages: int = 20


class PlanJobRequest(BaseModel):
    app_slug: str
    user_intent: str


class TestcaseJobRequest(BaseModel):
    app_slug: str
    plan_id: str


class SpecJobRequest(BaseModel):
    app_slug: str
    plan_id: str
    flow_id: str | None = None


class RunSpecJobRequest(BaseModel):
    app_slug: str
    plan_id: str
    spec_path: str | None = None


class PipelineJobRequest(BaseModel):
    app_slug: str
    url: str | None = None
    contract_filename: str | None = None
    steps: list[str] = Field(default_factory=list)
    modules: list[str] = Field(default_factory=lambda: ["auth", "navigation", "content"])
    max_pages: int = 20


class JobResult(BaseModel):
    manifest: str | None = None
    steps_run: list[str] = Field(default_factory=list)
    flows: list[str] = Field(default_factory=list)
    artifact_path: str | None = None
    plan_id: str | None = None
    flow_id: str | None = None
    exit_code: int | None = None
    passed: bool | None = None
    report_path: str | None = None


class JobResponse(BaseModel):
    id: str
    job_type: JobType
    status: JobStatus
    created_at: str
    started_at: str | None = None
    finished_at: str | None = None
    app_slug: str
    request: dict[str, Any]
    result: JobResult | None = None
    error: str | None = None


class JobListResponse(BaseModel):
    jobs: list[JobResponse]


class LogResponse(BaseModel):
    offset: int
    content: str
    eof: bool


class FileEntry(BaseModel):
    path: str
    name: str
    is_dir: bool
    size: int | None = None


class FileListResponse(BaseModel):
    path: str
    entries: list[FileEntry]


class FileContentResponse(BaseModel):
    path: str
    content: str
    language: str


class AppSummary(BaseModel):
    slug: str
    manifest: dict[str, Any] | None = None
    generated_at: str | None = None
    flows_count: int = 0


class AppListResponse(BaseModel):
    apps: list[AppSummary]


class HealthResponse(BaseModel):
    status: str
    openai_configured: bool
    data_root: str


class AppDetailResponse(BaseModel):
    slug: str
    manifest: dict[str, Any] | None = None
    file_count: int = 0


class TestcaseEntry(BaseModel):
    flow_id: str
    path: str
    title: str = ""


class SpecEntry(BaseModel):
    flow_id: str
    path: str


class PlanEntry(BaseModel):
    id: str
    user_intent: str
    plan_path: str
    created_at: str
    testcases: list[TestcaseEntry] = Field(default_factory=list)
    specs: list[SpecEntry] = Field(default_factory=list)


class WorkspaceResponse(BaseModel):
    app_slug: str
    contract_path: str | None = None
    contract_exists: bool = False
    base_url: str | None = None
    page_count: int = 0
    plans: list[PlanEntry] = Field(default_factory=list)


class ContractInfoResponse(BaseModel):
    app_slug: str
    contract_path: str | None
    exists: bool
    base_url: str | None = None
    app_name: str | None = None
    page_count: int = 0
    scraped_at: str | None = None
