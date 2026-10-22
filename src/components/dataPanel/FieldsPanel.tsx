import { Dataset } from "../../types";

interface FieldsPanelProps {
  dataset: Dataset;
  dragCol: string | null;
  setDragCol: (col: string | null) => void;
  overCol: string | null;
  setOverCol: (updater: string | null | ((prev: string | null) => string | null)) => void;
  reorderColumn: (src: string, dst: string) => void;
}

export function FieldsPanel({
  dataset,
  dragCol,
  setDragCol,
  overCol,
  setOverCol,
  reorderColumn,
}: FieldsPanelProps) {
  return (
    <div className="fields-panel">
      <div className="fields-title">Fields</div>
      <div className="col-list fields-list">
        {dataset.columns.map((c) => (
          <div
            key={c}
            className={`col-chip draggable ${overCol === c && dragCol && dragCol !== c ? "reorder-over" : ""}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/column", c);
              e.dataTransfer.setData("text/plain", c);
              e.dataTransfer.effectAllowed = "copyMove";
              setDragCol(c);
            }}
            onDragEnd={() => {
              setDragCol(null);
              setOverCol(null);
            }}
            onDragOver={(e) => {
              if (dragCol && dragCol !== c) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverCol(c);
              }
            }}
            onDragLeave={() => setOverCol((o) => (o === c ? null : o))}
            onDrop={(e) => {
              if (dragCol && dragCol !== c) {
                e.preventDefault();
                e.stopPropagation();
                reorderColumn(dragCol, c);
              }
              setDragCol(null);
              setOverCol(null);
            }}
            title={`Drag "${c}" to reorder, or onto a shelf`}
          >
            <span className={`type-dot ${dataset.types[c]}`} />
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
