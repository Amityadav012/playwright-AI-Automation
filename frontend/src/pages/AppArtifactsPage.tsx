import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, FileEntry } from "../api/client";

export default function AppArtifactsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api
      .listFiles(slug, "", true)
      .then((res) => setFiles(res.entries.filter((e) => !e.is_dir)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  async function openFile(path: string) {
    if (!slug) return;
    setSelected(path);
    setContent("Loading...");
    try {
      const res = await api.readFile(slug, path);
      setContent(res.content);
      setLanguage(res.language);
    } catch (e) {
      setContent("");
      setError(e instanceof Error ? e.message : "Failed to read file");
    }
  }

  if (!slug) return null;
  if (loading) return <p>Loading...</p>;
  if (error && !files.length) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h2>Artifacts — {slug}</h2>
      <div className="artifact-layout">
        <div className="file-tree">
          {files.map((file) => (
            <button
              key={file.path}
              type="button"
              className={selected === file.path ? "active" : ""}
              onClick={() => openFile(file.path)}
            >
              {file.path}
            </button>
          ))}
        </div>
        <div className="content-viewer">
          {selected ? (
            <>
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #dde3ea", display: "flex", justifyContent: "space-between" }}>
                <span>{selected} ({language})</span>
                <a className="btn" href={api.downloadUrl(slug, selected)} download>
                  Download
                </a>
              </div>
              <pre>{content}</pre>
            </>
          ) : (
            <p className="empty">Select a file to preview</p>
          )}
        </div>
      </div>
    </div>
  );
}
