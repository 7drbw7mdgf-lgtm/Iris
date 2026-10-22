import { ReactNode, useState } from "react";

const sectionOpenCache: Record<string, boolean> = {};

export function Section({
  title,
  children,
  open = true,
  action,
  count,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
  action?: ReactNode;
  count?: number;
}) {
  const [show, setShow] = useState<boolean>(() => (title in sectionOpenCache ? sectionOpenCache[title] : open));
  const toggle = () => {
    setShow((prev) => {
      const next = !prev;
      sectionOpenCache[title] = next;
      return next;
    });
  };
  return (
    <div className={`section ${show ? "open" : ""}`}>
      <div className="section-head">
        <button className="section-toggle" type="button" onClick={toggle}>
          <span className="chev">{show ? "▾" : "▸"}</span>
          <span>{title}</span>
          {count != null && count > 0 && <span className="section-badge">{count}</span>}
        </button>
        {action}
      </div>
      {show && <div className="section-body">{children}</div>}
    </div>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="ctl-row">
      <span className="ctl-label">{label}</span>
      <span className="ctl-input">{children}</span>
    </label>
  );
}

export function DualSliderInput({
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = "",
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
}) {
  return (
    <div className="dual-slider-input">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="dual-number-wrap">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
        />
        {unit && <span className="dual-unit-label">{unit}</span>}
      </div>
    </div>
  );
}

