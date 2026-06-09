import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  reportUrl: string | null;
  passed?: boolean | null;
};

export default function PlaywrightReportModal({ open, onClose, reportUrl, passed }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="report-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="report-modal-panel" role="dialog" aria-modal="true" aria-label="Playwright report">
        <div className="report-modal-header">
          <div className="report-modal-title">
            <span>Playwright report</span>
            {passed !== undefined && passed !== null && (
              <span className={`report-modal-badge ${passed ? "pass" : "fail"}`}>
                {passed ? "Passed" : "Failed"}
              </span>
            )}
          </div>
          <button type="button" className="report-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="report-modal-body">
          {reportUrl ? (
            <iframe className="report-modal-iframe" src={reportUrl} title="Playwright report" />
          ) : (
            <p className="report-modal-empty">No report available — run Play again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
