import { useState, useEffect } from "react";
import {
  UpdateInfo,
  UpdateProgress,
  getUpdateInfo,
  checkForUpdates,
  downloadUpdate,
  cancelUpdateDownload,
  installUpdateAndRestart,
} from "../../app/updaterService";

export function AboutTab() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [busy, setBusy] = useState<"" | "checking" | "downloading" | "installing">("");
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState<UpdateProgress | null>(null);

  useEffect(() => {
    getUpdateInfo()
      .then(setInfo)
      .catch((e) => setError(String(e?.message || e)));
  }, []);

  const handleCheck = async () => {
    if (busy) return;
    setBusy("checking");
    setError("");
    try {
      const nextInfo = await checkForUpdates();
      setInfo(nextInfo);
      if (nextInfo.availableVersion && nextInfo.autoDownload && nextInfo.canUpdate && !nextInfo.ready) {
        handleDownload();
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
    <div className="settings-view-panel about-panel">
      <div className="about-hero">
        <div className="about-icon">❀</div>
        <h2>Iris Scientific Studio</h2>
        <div className="about-version">
          {info?.currentVersion ? `Release Version ${info.currentVersion}` : "Release Version 5.2.0"} (macOS Apple Silicon)
        </div>
        <p className="about-lead">
          Publication-grade scientific plotting workbench bridging interactive visual direct-manipulation with rigorous, reproducible R (ggplot2) and Python code generation.
        </p>
      </div>

      <div className="settings-card" style={{ marginTop: 12, padding: "14px 16px", borderRadius: 8, background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-subtle, #e2e8f0)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ fontSize: 13, display: "block" }}>GitHub Software Updates</strong>
            <span style={{ fontSize: 12, color: "var(--text-muted, #64748b)" }}>
              {busy === "checking"
                ? "Connecting to GitHub releases…"
                : info?.availableVersion
                ? `Iris ${info.availableVersion} is available for download!`
                : info?.lastChecked
                ? "Iris is up to date."
                : "Check GitHub for the latest signed releases and patches."}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {busy === "downloading" && (
              <button className="secondary-btn" onClick={handleCancel} style={{ fontSize: 12, padding: "4px 10px" }}>
                Cancel
              </button>
            )}

            {info?.ready ? (
              <button
                className="primary-btn"
                onClick={handleInstall}
                disabled={busy === "installing"}
                style={{ fontSize: 12, padding: "5px 12px", background: "#16a34a", borderColor: "#15803d" }}
              >
                {busy === "installing" ? "Restarting…" : "Restart & Install"}
              </button>
            ) : info?.availableVersion && !info.ready ? (
              <button
                className="primary-btn"
                onClick={handleDownload}
                disabled={busy === "downloading" || !info.canUpdate}
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                {busy === "downloading" ? "Downloading…" : "Download Update"}
              </button>
            ) : (
              <button
                className="secondary-btn"
                onClick={handleCheck}
                disabled={busy === "checking"}
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                {busy === "checking" ? "Checking…" : "Check for Updates"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#dc2626" }}>
            {error}
          </div>
        )}

        {busy === "downloading" && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>{progress?.phase === "verifying" ? "Verifying signature…" : "Downloading from GitHub…"}</span>
              {percent !== null && <span>{percent}%</span>}
            </div>
            <div style={{ height: 4, width: "100%", background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${percent ?? 30}%`, background: "#3b82f6", transition: "width 0.2s" }} />
            </div>
          </div>
        )}
      </div>

      <div className="about-specs-grid" style={{ marginTop: 14 }}>
        <div className="spec-card">
          <strong>50 Graph Types</strong>
          <span>Full coverage of distribution, correlation, ranking, evolution, and genomic charts</span>
        </div>
        <div className="spec-card">
          <strong>Dual R &amp; Python Engines</strong>
          <span>Zero-lock-in export to pure native ggplot2 or matplotlib/seaborn scripts</span>
        </div>
        <div className="spec-card">
          <strong>Publication Standards</strong>
          <span>Nature, Science, and Cell dimension presets with 300/600 DPI vector fidelity</span>
        </div>
        <div className="spec-card">
          <strong>GitHub Updates</strong>
          <span>Automatic signed updates verified via cryptographic signatures from GitHub releases</span>
        </div>
      </div>
    </div>
  );
}
