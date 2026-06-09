import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const ALL_STEPS = ["scrape", "plan", "yaml", "spec"];
const ALL_MODULES = ["auth", "navigation", "content"];

export default function NewRunPage() {
  const navigate = useNavigate();
  const [appSlug, setAppSlug] = useState("bihar-krishi");
  const [url, setUrl] = useState("");
  const [contractFilename, setContractFilename] = useState("bihar-contract.json");
  const [steps, setSteps] = useState<string[]>(["plan", "yaml", "spec"]);
  const [modules, setModules] = useState<string[]>([...ALL_MODULES]);
  const [maxPages, setMaxPages] = useState(20);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleItem(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const job = await api.startJob({
        app_slug: appSlug.trim(),
        url: url.trim() || null,
        contract_filename: contractFilename.trim() || null,
        steps,
        modules,
        max_pages: maxPages,
      });
      navigate(`/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>New Pipeline Run</h2>
      <p className="note">
        Human review gates: edit test plans before running <strong>yaml</strong>, and review YAML
        before running <strong>spec</strong>. Run stages separately when you need to review artifacts.
      </p>

      <form className="form-grid" onSubmit={onSubmit}>
        <div>
          <label htmlFor="appSlug">App slug</label>
          <input id="appSlug" type="text" value={appSlug} onChange={(e) => setAppSlug(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="url">Target URL (optional — enables scrape step)</label>
          <input id="url" type="url" placeholder="https://staging.example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>

        <div>
          <label htmlFor="contract">Contract filename</label>
          <input id="contract" type="text" value={contractFilename} onChange={(e) => setContractFilename(e.target.value)} />
        </div>

        <div>
          <label>Steps</label>
          <div className="checkbox-group">
            {ALL_STEPS.map((step) => (
              <label key={step}>
                <input
                  type="checkbox"
                  checked={steps.includes(step)}
                  onChange={() => toggleItem(steps, step, setSteps)}
                />
                {step}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label>Modules</label>
          <div className="checkbox-group">
            {ALL_MODULES.map((mod) => (
              <label key={mod}>
                <input
                  type="checkbox"
                  checked={modules.includes(mod)}
                  onChange={() => toggleItem(modules, mod, setModules)}
                />
                {mod}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="maxPages">Max pages (scrape)</label>
          <input id="maxPages" type="number" min={1} max={100} value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} />
        </div>

        {error && <p className="error">{error}</p>}

        <div>
          <button type="submit" disabled={submitting || steps.length === 0 || modules.length === 0}>
            {submitting ? "Starting..." : "Start Pipeline"}
          </button>
        </div>
      </form>
    </div>
  );
}
