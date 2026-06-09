const API_BASE = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    const msg = typeof detail === "string" ? detail : JSON.stringify(detail) || res.statusText;
    throw new Error(msg || "Request failed");
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
  artifact_path: string | null;
  plan_id: string | null;
  flow_id: string | null;
  exit_code?: number | null;
  passed?: boolean | null;
  report_path?: string | null;
}

export interface JobResponse {
  id: string;
  job_type: "scrape" | "plan" | "testcase" | "spec" | "run" | "pipeline";
  status: "queued" | "running" | "completed" | "failed";
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  app_slug: string;
  request: Record<string, unknown>;
  result: JobResult | null;
  error: string | null;
}

export interface TestcaseEntry {
  flow_id: string;
  path: string;
  title: string;
}

export interface SpecEntry {
  flow_id: string;
  path: string;
}

export interface PlanEntry {
  id: string;
  user_intent: string;
  plan_path: string;
  created_at: string;
  testcases: TestcaseEntry[];
  specs: SpecEntry[];
}

export interface Workspace {
  app_slug: string;
  contract_path: string | null;
  contract_exists: boolean;
  base_url: string | null;
  page_count: number;
  plans: PlanEntry[];
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
  getWorkspace: (slug: string) => request<Workspace>(`/api/apps/${slug}/workspace`),
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
  extractContract: (body: {
    app_slug: string;
    url: string;
    contract_filename?: string | null;
    max_pages: number;
  }) => request<JobResponse>("/api/jobs/scrape", { method: "POST", body: JSON.stringify(body) }),
  generatePlan: (slug: string, user_intent: string) =>
    request<JobResponse>(`/api/apps/${slug}/generate/plan`, {
      method: "POST",
      body: JSON.stringify({ app_slug: slug, user_intent }),
    }),
  generateTestcase: (slug: string, plan_id: string) =>
    request<JobResponse>(`/api/apps/${slug}/generate/testcase`, {
      method: "POST",
      body: JSON.stringify({ app_slug: slug, plan_id }),
    }),
  generateSpec: (slug: string, plan_id: string) =>
    request<JobResponse>(`/api/apps/${slug}/generate/spec`, {
      method: "POST",
      body: JSON.stringify({ app_slug: slug, plan_id }),
    }),
  runSpec: (slug: string, plan_id: string, spec_path?: string) =>
    request<JobResponse>(`/api/apps/${slug}/run/spec`, {
      method: "POST",
      body: JSON.stringify({ app_slug: slug, plan_id, spec_path: spec_path ?? null }),
    }),
  getJob: (id: string) => request<JobResponse>(`/api/jobs/${id}`),
  listJobs: () => request<{ jobs: JobResponse[] }>("/api/jobs"),
  getLogs: (id: string, offset: number) =>
    request<{ offset: number; content: string; eof: boolean }>(
      `/api/jobs/${id}/logs?offset=${offset}`,
    ),
};

export async function pollJobUntilDone(
  jobId: string,
  intervalMs = 2000,
): Promise<JobResponse> {
  for (;;) {
    const job = await api.getJob(jobId);
    if (job.status === "completed" || job.status === "failed") {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
