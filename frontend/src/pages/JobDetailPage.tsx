import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, JobResponse } from "../api/client";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [logs, setLogs] = useState("");
  const [error, setError] = useState("");
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function poll() {
      try {
        const [jobRes, logRes] = await Promise.all([
          api.getJob(id!),
          api.getLogs(id!, offsetRef.current),
        ]);
        if (!active) return;
        setJob(jobRes);
        if (logRes.content) {
          setLogs((prev) => prev + logRes.content);
          offsetRef.current = logRes.offset;
        }
        if (jobRes.status === "queued" || jobRes.status === "running") {
          setTimeout(poll, 2000);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load job");
      }
    }

    poll();
    return () => {
      active = false;
    };
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!job) return <p>Loading job...</p>;

  return (
    <>
      <div className="card">
        <h2>
          Job {job.id}{" "}
          <span className={`badge badge-${job.status}`}>{job.status}</span>
        </h2>
        <p>
          App: <strong>{job.app_slug}</strong> · Steps: {job.request.steps.join(", ")}
        </p>
        {job.result && (
          <p>
            Completed steps: {job.result.steps_run.join(", ")} · Flows:{" "}
            {job.result.flows.join(", ") || "none"}
          </p>
        )}
        {job.error && <p className="error">{job.error}</p>}
        {job.status === "completed" && (
          <p>
            <Link to={`/apps/${job.app_slug}`}>Browse generated artifacts →</Link>
          </p>
        )}
      </div>

      <div className="card">
        <h2>Logs</h2>
        <div className="log-panel">{logs || "Waiting for logs..."}</div>
      </div>
    </>
  );
}
