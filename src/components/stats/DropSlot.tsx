import { useState } from "react";
import { Dataset } from "../../types";

function safeColumnFromJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.column === "string" ? parsed.column : "";
  } catch {
    return "";
  }
}

export function DropSlot({
  label,
  value,
  dataset,
  options,
  allowEmpty = false,
  onChange,
}: {
  label: string;
  value: string;
  dataset: Dataset;
  options: string[];
  allowEmpty?: boolean;
  onChange: (value: string) => void;
}) {
  const [over, setOver] = useState(false);
  const validValue = value && dataset.columns.includes(value);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const rawJson = e.dataTransfer.getData("application/json");
    const jsonCol = rawJson ? safeColumnFromJson(rawJson) : "";
    const col = e.dataTransfer.getData("text/column") || jsonCol || e.dataTransfer.getData("text/plain");
    if (!col || !dataset.columns.includes(col)) return;
    e.preventDefault();
    setOver(false);
    onChange(col);
  };

  return (
    <div className="stats-drop-slot">
      <div className="stats-drop-label">{label}</div>
      <div
        className={`stats-drop-target ${over ? "over" : ""} ${validValue ? "filled" : ""}`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("text/column") || e.dataTransfer.types.includes("text/plain")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {validValue ? (
          <span className="field-pill">
            <span className={`type-dot ${dataset.types[value]}`} />
            {value}
            <button className="pill-x" type="button" title="Remove" onClick={() => onChange("")}>×</button>
          </span>
        ) : (
          <span className="shelf-placeholder">drop field</span>
        )}
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {allowEmpty && <option value="">(none)</option>}
        {!allowEmpty && !value && <option value="">(pick...)</option>}
        {options.map((c) => <option key={c}>{c}</option>)}
      </select>
    </div>
  );
}
