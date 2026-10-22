import { type UserSettings } from "../../types";

export function DataStatsTab({
  settings,
  onSaveSettings,
}: {
  settings: UserSettings;
  onSaveSettings: (patch: Partial<UserSettings>) => void;
}) {
  return (
    <div className="settings-view-panel">
      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Numeric Display Precision</h3>
          <p>Number of decimal places shown in data inspector, tables, and statistics cards</p>
        </div>
        <div className="precision-selector">
          {[1, 2, 3, 4, 5, 6].map((p) => (
            <button
              key={p}
              type="button"
              className={`precision-btn ${(settings.decimalPrecision ?? 2) === p ? "active" : ""}`}
              onClick={() => onSaveSettings({ decimalPrecision: p })}
            >
              <strong>{p}</strong>
              <span>{(0.123456).toFixed(p)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-title">
          <h3>Default Statistical Analysis</h3>
          <p>Automatic hypothesis test applied when comparing experimental groups</p>
        </div>
        <div className="settings-form-row">
          <div className="form-item full">
            <label htmlFor="stat-test">Hypothesis Test:</label>
            <select
              id="stat-test"
              value={settings.defaultStatTest || "none"}
              onChange={(e) => onSaveSettings({ defaultStatTest: e.target.value as any })}
            >
              <option value="none">None (Plot raw data without overlay annotations)</option>
              <option value="ttest">Two-sample Student's t-test</option>
              <option value="anova">One-way ANOVA with post-hoc Tukey</option>
              <option value="regression">Linear Regression Trendline &amp; R²</option>
              <option value="correlation">Pearson &amp; Spearman Correlation Matrix</option>
              <option value="average">Group Mean ± SEM Bars</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
