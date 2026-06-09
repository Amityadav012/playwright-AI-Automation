import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api, PlanEntry, pollJobUntilDone, Workspace } from "../api/client";
import GenerateButton from "../components/GenerateButton";

function truncate(text: string, max = 60) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function basename(path: string) {
  return path.split("/").pop() || path;
}

type WorkspaceNavState = { selectPlanId?: string };
type BusyKind = "" | "plan" | "testcase" | "spec";

function PlanSelect({
  id,
  plans,
  value,
  onChange,
  disabled,
}: {
  id: string;
  plans: PlanEntry[];
  value: string;
  onChange: (planId: string) => void;
  disabled?: boolean;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">— select a test plan —</option>
      {plans.map((p) => (
        <option key={p.id} value={p.id}>
          {p.id} — {truncate(p.user_intent)} ({new Date(p.created_at).toLocaleDateString()})
        </option>
      ))}
    </select>
  );
}

export default function AppWorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [ws, setWs] = useState<Workspace | null>(null);
  const [intent, setIntent] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planPreview, setPlanPreview] = useState("");
  const [casePreview, setCasePreview] = useState("");
  const [specPreview, setSpecPreview] = useState("");
  const [selectedSpecPath, setSelectedSpecPath] = useState("");
  const [showSpecContent, setShowSpecContent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<BusyKind>("");
  const [statusMessage, setStatusMessage] = useState("");

  const jobRunning = busy !== "";

  const loadWorkspace = useCallback(async (): Promise<Workspace | null> => {
    if (!slug) return null;
    const data = await api.getWorkspace(slug);
    setWs(data);
    return data;
  }, [slug]);

  useEffect(() => {
    const nav = location.state as WorkspaceNavState | null;
    loadWorkspace()
      .then((data) => {
        if (!data) return;
        if (nav?.selectPlanId && data.plans.some((p) => p.id === nav.selectPlanId)) {
          setSelectedPlanId(nav.selectPlanId);
        } else if (data.plans.length === 1) {
          setSelectedPlanId(data.plans[0].id);
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [loadWorkspace, location.key]);

  const selectedPlan: PlanEntry | undefined = ws?.plans.find((p) => p.id === selectedPlanId);
  const testcase = selectedPlan?.testcases[0];
  const specs = selectedPlan?.specs ?? [];
  const specPathsKey = specs.map((s) => s.path).join("|");
  const hasSpec = specs.length > 0;

  useEffect(() => {
    if (!slug || !selectedPlan) {
      setPlanPreview("");
      return;
    }
    api.readFile(slug, selectedPlan.plan_path)
      .then((f) => setPlanPreview(f.content))
      .catch(() => setPlanPreview("(unable to load plan)"));
  }, [slug, selectedPlan]);

  useEffect(() => {
    if (!slug || !testcase) {
      setCasePreview("");
      return;
    }
    api.readFile(slug, testcase.path)
      .then((f) => setCasePreview(f.content))
      .catch(() => setCasePreview("(unable to load testcase)"));
  }, [slug, testcase]);

  useEffect(() => {
    if (!specs.length) {
      setSelectedSpecPath("");
      setShowSpecContent(false);
      setSpecPreview("");
      return;
    }
    setSelectedSpecPath((prev) =>
      prev && specs.some((s) => s.path === prev) ? prev : specs[0].path,
    );
  }, [selectedPlanId, specPathsKey, specs]);

  async function loadSpecContent(path: string) {
    if (!slug) return;
    setSpecPreview("Loading…");
    try {
      const f = await api.readFile(slug, path);
      setSpecPreview(f.content);
    } catch {
      setSpecPreview("(unable to load spec)");
    }
  }

  function onPlanChange(planId: string) {
    setSelectedPlanId(planId);
    setCasePreview("");
    setSpecPreview("");
    setShowSpecContent(false);
  }

  function selectSpec(path: string) {
    setSelectedSpecPath(path);
    if (showSpecContent) {
      loadSpecContent(path);
    }
  }

  function toggleSpecView() {
    if (!selectedSpecPath) return;
    if (showSpecContent) {
      setShowSpecContent(false);
      return;
    }
    setShowSpecContent(true);
    loadSpecContent(selectedSpecPath);
  }

  async function runJob(kind: BusyKind, start: () => Promise<{ id: string }>, doneLabel: string) {
    setError("");
    setStatusMessage("");
    setBusy(kind);
    try {
      const started = await start();
      setStatusMessage("Job running…");
      const job = await pollJobUntilDone(started.id);
      if (job.status === "failed") {
        setError(job.error || "Job failed");
        return;
      }
      setStatusMessage(doneLabel);
      const data = await loadWorkspace();
      if (job.result?.plan_id && data?.plans.some((p) => p.id === job.result?.plan_id)) {
        setSelectedPlanId(job.result.plan_id);
      }
      if (kind === "spec" && showSpecContent && selectedSpecPath) {
        await loadSpecContent(selectedSpecPath);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy("");
    }
  }

  async function handleGeneratePlan() {
    if (!slug || !intent.trim()) return;
    await runJob(
      "plan",
      () => api.generatePlan(slug, intent.trim()),
      "Test plan generated.",
    );
  }

  async function handleGenerateTestcase() {
    if (!slug || !selectedPlanId) return;
    await runJob(
      "testcase",
      () => api.generateTestcase(slug, selectedPlanId),
      "Test case generated.",
    );
  }

  async function handleGenerateSpec() {
    if (!slug || !selectedPlanId) return;
    await runJob(
      "spec",
      () => api.generateSpec(slug, selectedPlanId),
      "Playwright spec generated.",
    );
  }

  if (!slug) return null;
  if (!ws) return <p>Loading workspace...</p>;

  return (
    <>
      <div className="card">
        <h2>Workspace — {slug}</h2>
        <p className="note">One test plan → one test case → one Playwright spec.</p>
        {ws.contract_exists ? (
          <p>
            Contract: {ws.page_count} pages · {ws.base_url || "unknown URL"}
          </p>
        ) : (
          <p className="error">
            No contract found. <Link to="/run">Extract contract</Link> first.
          </p>
        )}
        <p>
          <Link to={`/apps/${slug}`}>Browse all artifacts</Link>
        </p>
      </div>

      <div className="card">
        <h2>1. Test Plan</h2>
        <label htmlFor="intent">What do you want to test?</label>
        <textarea
          id="intent"
          rows={3}
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g. Verify all nav links open the correct pages"
          disabled={!ws.contract_exists || jobRunning}
        />
        <div style={{ marginTop: "0.75rem" }}>
          <GenerateButton
            loading={busy === "plan"}
            disabled={!ws.contract_exists || !intent.trim() || jobRunning}
            onClick={handleGeneratePlan}
            loadingLabel="Generating test plan…"
          >
            Generate Test Plan
          </GenerateButton>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label htmlFor="planSelect">Test plans</label>
          <PlanSelect
            id="planSelect"
            plans={ws.plans}
            value={selectedPlanId}
            onChange={onPlanChange}
            disabled={jobRunning}
          />
        </div>
        {planPreview && (
          <div className="content-viewer" style={{ marginTop: "0.75rem", maxHeight: 240 }}>
            <pre>{planPreview}</pre>
          </div>
        )}
      </div>

      <div className="card">
        <h2>2. Test Case</h2>
        <div>
          <label htmlFor="planSelectCase">Test plan</label>
          <PlanSelect
            id="planSelectCase"
            plans={ws.plans}
            value={selectedPlanId}
            onChange={onPlanChange}
            disabled={jobRunning}
          />
        </div>
        {selectedPlanId && (
          <p style={{ marginTop: "0.5rem" }}>
            Status: {testcase ? `✓ ${testcase.path}` : "Not generated yet"}
          </p>
        )}
        <div style={{ marginTop: "0.75rem" }}>
          <GenerateButton
            loading={busy === "testcase"}
            disabled={!selectedPlanId || jobRunning}
            onClick={handleGenerateTestcase}
            loadingLabel="Generating test case…"
          >
            {testcase ? "Regenerate Test Case" : "Generate Test Case"}
          </GenerateButton>
        </div>
        {casePreview && (
          <div className="content-viewer" style={{ marginTop: "0.75rem", maxHeight: 240 }}>
            <pre>{casePreview}</pre>
          </div>
        )}
      </div>

      <div className="card">
        <h2>3. Playwright</h2>
        <div>
          <label htmlFor="planSelectSpec">Test plan</label>
          <PlanSelect
            id="planSelectSpec"
            plans={ws.plans}
            value={selectedPlanId}
            onChange={onPlanChange}
            disabled={jobRunning}
          />
        </div>
        {selectedPlanId && !testcase && (
          <p className="note" style={{ marginTop: "0.75rem" }}>
            Generate a test case in step 2 before creating Playwright code.
          </p>
        )}
        {selectedPlanId && testcase && (
          <div className="playwright-panel" style={{ marginTop: "0.75rem" }}>
            <div className="spec-list">
              <div className="spec-list-header">Generated specs</div>
              {hasSpec ? (
                specs.map((s) => (
                  <button
                    key={s.path}
                    type="button"
                    className={`spec-list-item${selectedSpecPath === s.path ? " active" : ""}`}
                    onClick={() => selectSpec(s.path)}
                    disabled={jobRunning}
                  >
                    <span className="spec-list-name">{basename(s.path)}</span>
                    <span className="spec-list-path">{s.path}</span>
                  </button>
                ))
              ) : (
                <p className="spec-list-empty">No Playwright spec yet — use Regenerate to generate.</p>
              )}
            </div>
            <div className="spec-actions">
              <GenerateButton
                loading={busy === "spec"}
                disabled={!selectedPlanId || !testcase || jobRunning}
                onClick={handleGenerateSpec}
                loadingLabel="Generating…"
              >
                {hasSpec ? "Regenerate" : "Generate"}
              </GenerateButton>
              <button type="button" className="btn-play" disabled={!hasSpec || jobRunning}>
                Play
              </button>
              <button
                type="button"
                className={`btn-view${showSpecContent ? " open" : ""}`}
                disabled={!selectedSpecPath || jobRunning}
                onClick={toggleSpecView}
                aria-expanded={showSpecContent}
              >
                View code
                <span className="btn-chevron" aria-hidden="true">
                  {showSpecContent ? "▴" : "▾"}
                </span>
              </button>
            </div>
          </div>
        )}
        {showSpecContent && specPreview && (
          <div className="content-viewer spec-content-panel">
            <div className="spec-content-header">
              <span>{basename(selectedSpecPath)}</span>
            </div>
            <pre>{specPreview}</pre>
          </div>
        )}
      </div>

      {busy && (
        <p className="job-status">
          <span className="spinner" style={{ borderColor: "rgba(37,99,235,0.25)", borderTopColor: "#2563eb" }} />
          {statusMessage || "Working…"}
        </p>
      )}
      {error && <p className="error">{error}</p>}
    </>
  );
}
