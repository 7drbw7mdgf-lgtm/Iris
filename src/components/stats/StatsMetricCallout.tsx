import { ParsedStatSummary } from "../../statsToolkit";

export function StatsMetricCallout({ parsedMetrics }: { parsedMetrics: ParsedStatSummary }) {
  if (!parsedMetrics.pString) return null;

  return (
    <div className="stats-metric-callout">
      <div className="metric-callout-item">
        <span className="metric-label">P-VALUE</span>
        <span className={`metric-pill ${parsedMetrics.isSignificant ? "sig" : "ns"}`}>
          {parsedMetrics.pString}
        </span>
      </div>
      {parsedMetrics.statisticName && parsedMetrics.statisticValue !== undefined && (
        <div className="metric-callout-item">
          <span className="metric-label">STATISTIC ({parsedMetrics.statisticName})</span>
          <span className="metric-val">{parsedMetrics.statisticValue.toFixed(4)}</span>
        </div>
      )}
      {parsedMetrics.effectName && parsedMetrics.effectValue !== undefined && (
        <div className="metric-callout-item">
          <span className="metric-label">EFFECT ({parsedMetrics.effectName})</span>
          <span className="metric-val">{parsedMetrics.effectValue.toFixed(4)}</span>
        </div>
      )}
      {parsedMetrics.apaReport && (
        <div className="metric-callout-item apa-box">
          <span className="metric-label">APA FORMAT</span>
          <span className="metric-val apa">{parsedMetrics.apaReport}</span>
        </div>
      )}
    </div>
  );
}
