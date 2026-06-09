from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

JobStatus = Literal["queued", "running", "completed", "failed"]


class PipelineJobRequest(BaseModel):
    app_slug: str
    url: str | None = None
    contract_filename: str | None = None
    steps: list[str] = Field(default_factory=lambda: ["plan", "yaml", "spec"])
    modules: list[str] = Field(default_factory=lambda: ["auth", "navigation", "content"])
    max_pages: int = 20


class JobResult(BaseModel):
    manifest: str | None = None
    steps_run: list[str] = Field(default_factory=list)
    flows: list[str] = Field(default_factory=list)


class JobResponse(BaseModel):
    id: str
    status: JobStatus
    created_at: str
    started_at: str | None = None
    finished_at: str | None = None
    app_slug: str
    request: PipelineJobRequest
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
