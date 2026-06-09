const API_BASE = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || res.statusText || "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface AppSummary {
  slug: string;
  manifest: Record<string, unknown> | null;
  generated_at: string | null;
  flows_count: number;
}

export interface JobResult {
  manifest: string | null;
  steps_run: string[];
  flows: string[];
}

export interface PipelineJobRequest {
  app_slug: string;
  url?: string | null;
  contract_filename?: string | null;
  steps: string[];
  modules: string[];
  max_pages: number;
}

export interface JobResponse {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  app_slug: string;
  request: PipelineJobRequest;
  result: JobResult | null;
  error: string | null;
}

export interface FileEntry {
  path: string;
  name: string;
  is_dir: boolean;
  size: number | null;
}

export interface FileContent {
  path: string;
  content: string;
  language: string;
}

export const api = {
  health: () => request<{ status: string; openai_configured: boolean }>("/api/health"),
  listApps: () => request<{ apps: AppSummary[] }>("/api/apps"),
  getApp: (slug: string) =>
    request<{ slug: string; manifest: Record<string, unknown> | null; file_count: number }>(
      `/api/apps/${slug}`,
    ),
  listFiles: (slug: string, path = "", recursive = false) =>
    request<{ path: string; entries: FileEntry[] }>(
      `/api/apps/${slug}/files?path=${encodeURIComponent(path)}&recursive=${recursive}`,
    ),
  readFile: (slug: string, path: string) =>
    request<FileContent>(
      `/api/apps/${slug}/files/content?path=${encodeURIComponent(path)}`,
    ),
  downloadUrl: (slug: string, path: string) =>
    `${API_BASE}/api/apps/${slug}/files/download?path=${encodeURIComponent(path)}`,
  startJob: (body: PipelineJobRequest) =>
    request<JobResponse>("/api/jobs/pipeline", { method: "POST", body: JSON.stringify(body) }),
  getJob: (id: string) => request<JobResponse>(`/api/jobs/${id}`),
  listJobs: () => request<{ jobs: JobResponse[] }>("/api/jobs"),
  getLogs: (id: string, offset: number) =>
    request<{ offset: number; content: string; eof: boolean }>(
      `/api/jobs/${id}/logs?offset=${offset}`,
    ),
};
