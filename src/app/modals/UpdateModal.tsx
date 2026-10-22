import { useState, useEffect } from "react";
import {
  UpdateInfo,
  UpdateProgress,
  getUpdateInfo,
  checkForUpdates,
  downloadUpdate,
  cancelUpdateDownload,
  setUpdatePreferences,
  installUpdateAndRestart,
} from "../updaterService";

export interface UpdateModalProps {
  open: boolean;
  onClose: () => void;
  notify?: (msg: string) => void;
}

export function UpdateModal({ open, onClose, notify }: UpdateModalProps) {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [busy, setBusy] = useState<"" | "checking" | "downloading" | "installing">("");
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState<UpdateProgress | null>(null);

  useEffect(() => {
    if (open) {
      setError("");
      setProgress(null);
      getUpdateInfo()
        .then(setInfo)
        .catch((e) => setError(String(e?.message || e)));
    }
  }, [open]);

  if (!open) return null;

  const handleCheck = async () => {
    if (busy) return;
    setBusy("checking");
    setError("");
    try {
      const nextInfo = await checkForUpdates();
      setInfo(nextInfo);
      if (nextInfo.availableVersion) {
        notify?.(`Iris ${nextInfo.availableVersion} is available!`);
        if (nextInfo.autoDownload && nextInfo.canUpdate && !nextInfo.ready) {
          handleDownload();
          return;
        }
      } else {
        notify?.("Iris is up to date.");
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy("");
    }
  };

  const handleDownload = async () => {
    if (busy) return;
    setBusy("downloading");
    setError("");
    setProgress(null);
    try {
      const nextInfo = await downloadUpdate((evt) => {
        setProgress(evt);
      });
      setInfo(nextInfo);
      notify?.(`Iris ${nextInfo.availableVersion || "update"} is ready to install.`);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy("");
      setProgress(null);
    }
  };

  const handleCancel = async () => {
    if (busy !== "downloading") return;
    try {
      await cancelUpdateDownload();
      setBusy("");
      setProgress(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  };

  const handleAutoDownloadChange = async (enabled: boolean) => {
    try {
      const next = await setUpdatePreferences(enabled);
      setInfo(next);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  };

  const handleInstall = async () => {
    if (busy) return;
    setBusy("installing");
    setError("");
    try {
      await installUpdateAndRestart();
    } catch (e: any) {
      setError(String(e?.message || e));
      setBusy("");
    }
  };

  const percent =
    progress?.total && progress.total > 0
      ? Math.min(100, Math.round((progress.downloaded / progress.total) * 100))
      : null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Software Updates"
      onMouseDown={onClose}
    >
      <div
        className="export-success-modal"
        style={{ maxWidth: 520, width: "100%" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="export-preview-head">
          <div>
            <div className="view-eyebrow">GitHub Releases</div>
            <h2>Software Updates</h2>
            <p style={{ margin: "4px 0 0", color: "var(--text-subtle)", fontSize: 13 }}>
              {info?.currentVersion ? `Installed version ${info.currentVersion}` : "Iris Desktop"}
            </p>
          </div>
          <button className="icon-mini-btn" onClick={onClose} aria-label="Close updates dialog">
            ×
          </button>
        </div>

        {error && (
          <div className="renderer-error-banner" style={{ margin: "12px 0 0", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
          {info?.availableVersion ? (
            <div
              style={{
                padding: "12px 14px",
                background: "var(--bg-active, #f0fdf4)",
                borderRadius: 8,
                border: "1px solid var(--border-subtle, #bbf7d0)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                <span style={{ color: "#16a34a" }}>●</span>
                <span>Iris {info.availableVersion} is available!</span>
              </div>
              {info.notes && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--text-muted)",
                    maxHeight: 120,
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {info.notes}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {busy === "checking"
                ? "Checking GitHub for updates…"
                : info?.lastChecked
                ? "Iris is currently up to date."
                : "Check GitHub to ensure you have the latest scientific features and security patches."}
            </div>
          )}

          {busy === "downloading" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>
                  {progress?.phase === "verifying"
                    ? "Verifying digital signature…"
                    : "Downloading update…"}
                </span>
                {percent !== null && <span>{percent}%</span>}
              </div>
              <div
                style={{
                  height: 6,
                  width: "100%",
                  backgroundColor: "var(--border-subtle, #e2e8f0)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${percent ?? 40}%`,
                    backgroundColor: "#3b82f6",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
            </div>
          )}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={info?.autoDownload ?? true}
              onChange={(e) => handleAutoDownloadChange(e.target.checked)}
              disabled={!!busy}
            />
            <span>Automatically download updates in the background</span>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
            borderTop: "1px solid var(--border-subtle, #e2e8f0)",
            paddingTop: 14,
          }}
        >
          {busy === "downloading" && (
            <button className="secondary-btn" onClick={handleCancel}>
              Cancel Download
            </button>
          )}

          {info?.ready ? (
            <button
              className="primary-btn"
              onClick={handleInstall}
              disabled={busy === "installing"}
              style={{ backgroundColor: "#16a34a", borderColor: "#15803d" }}
            >
              {busy === "installing" ? "Restarting…" : "Restart & Install"}
            </button>
          ) : info?.availableVersion && !info.ready ? (
            <button
              className="primary-btn"
              onClick={handleDownload}
              disabled={busy === "downloading" || !info.canUpdate}
            >
              {busy === "downloading" ? "Downloading…" : "Download Update"}
            </button>
          ) : (
            <button
              className="primary-btn"
              onClick={handleCheck}
              disabled={busy === "checking"}
            >
              {busy === "checking" ? "Checking…" : "Check for Updates"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
