import { useState } from "react";
import { type UserSettings } from "../types";
import type { RendererStatus } from "../tauri";
import { AppearanceTab } from "./settings/AppearanceTab";
import { CanvasTab } from "./settings/CanvasTab";
import { DataStatsTab } from "./settings/DataStatsTab";
import { ShortcutsTab } from "./settings/ShortcutsTab";
import { EnvironmentTab } from "./settings/EnvironmentTab";
import { AboutTab } from "./settings/AboutTab";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (patch: Partial<UserSettings>) => void;
  onResetSettings: () => void;
  rendererInfo?: RendererStatus | null;
  onRefreshRenderer?: () => void;
  onRepairPython?: () => void;
  onInstallSvglite?: () => void;
  rendererBusy?: string;
}

type SettingsTab = "appearance" | "canvas" | "data" | "shortcuts" | "environment" | "about";

export default function SettingsModal({
  open,
  onClose,
  settings,
  onSaveSettings,
  onResetSettings,
  rendererInfo,
  onRefreshRenderer,
  onRepairPython,
  onInstallSvglite,
  rendererBusy = "",
}: Props) {
  const [tab, setTab] = useState<SettingsTab>("appearance");
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Iris Preferences">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-brand">
            <div className="settings-app-icon" aria-hidden="true">❀</div>
            <div>
              <div className="settings-eyebrow">Preferences</div>
              <h2>Iris Settings</h2>
            </div>
          </div>
          <div className="settings-header-actions">
            <span className="settings-version-tag">v5.2.0</span>
            <button className="icon-mini-btn settings-close-btn" onClick={onClose} aria-label="Close preferences window">
              ×
            </button>
          </div>
        </div>

        {/* Modern Tab Bar */}
        <div className="settings-nav-bar" role="tablist">
          <button
            className={`settings-nav-item ${tab === "appearance" ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === "appearance"}
            onClick={() => setTab("appearance")}
          >
            <span className="nav-item-icon">🎨</span>
            <span>Appearance</span>
          </button>
          <button
            className={`settings-nav-item ${tab === "canvas" ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === "canvas"}
            onClick={() => setTab("canvas")}
          >
            <span className="nav-item-icon">📐</span>
            <span>Plotting &amp; Canvas</span>
          </button>
          <button
            className={`settings-nav-item ${tab === "data" ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === "data"}
            onClick={() => setTab("data")}
          >
            <span className="nav-item-icon">🧪</span>
            <span>Data &amp; Stats</span>
          </button>
          <button
            className={`settings-nav-item ${tab === "shortcuts" ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === "shortcuts"}
            onClick={() => setTab("shortcuts")}
          >
            <span className="nav-item-icon">⌨️</span>
            <span>Shortcuts</span>
          </button>
          <button
            className={`settings-nav-item ${tab === "environment" ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === "environment"}
            onClick={() => setTab("environment")}
          >
            <span className="nav-item-icon">🖥️</span>
            <span>Environments</span>
          </button>
          <button
            className={`settings-nav-item ${tab === "about" ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === "about"}
            onClick={() => setTab("about")}
          >
            <span className="nav-item-icon">ℹ️</span>
            <span>About</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="settings-body">
          {tab === "appearance" && <AppearanceTab settings={settings} onSaveSettings={onSaveSettings} />}
          {tab === "canvas" && <CanvasTab settings={settings} onSaveSettings={onSaveSettings} />}
          {tab === "data" && <DataStatsTab settings={settings} onSaveSettings={onSaveSettings} />}
          {tab === "shortcuts" && <ShortcutsTab />}
          {tab === "environment" && (
            <EnvironmentTab
              settings={settings}
              rendererInfo={rendererInfo}
              onRefreshRenderer={onRefreshRenderer}
              onRepairPython={onRepairPython}
              onInstallSvglite={onInstallSvglite}
              rendererBusy={rendererBusy}
            />
          )}
          {tab === "about" && <AboutTab />}
        </div>

        {/* Modal Footer */}
        <div className="settings-footer-modern">
          <div className="footer-left">
            {confirmReset ? (
              <div className="confirm-reset-bar">
                <span>Reset all settings to defaults?</span>
                <button
                  className="btn small bad"
                  type="button"
                  onClick={() => {
                    onResetSettings();
                    setConfirmReset(false);
                  }}
                >
                  Yes, Reset
                </button>
                <button className="btn small" type="button" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="btn small text-only" type="button" onClick={() => setConfirmReset(true)}>
                Reset to Defaults
              </button>
            )}
          </div>
          <div className="footer-right">
            <span className="auto-save-tag">Changes save automatically</span>
            <button className="btn small primary" type="button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
