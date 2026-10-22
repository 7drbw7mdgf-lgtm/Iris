import { useEffect, useState, useLayoutEffect, useRef } from "react";
import type { PythonArtist } from "../tauri";
import type { PythonArtistEdit } from "../pythonArtistOverrides";

interface Props {
  artists: PythonArtist[];
  selectedKey: string | null;
  overrides: Record<string, PythonArtistEdit>;
  busy: boolean;
  embedded?: boolean;
  onSelect: (key: string) => void;
  onApply: (key: string, edit: PythonArtistEdit) => void;
  onReset: (key: string) => void;
  onBack?: () => void;
  initialScrollTop?: number;
  onScroll?: (scrollTop: number) => void;
}

export default function PythonArtistInspector({
  artists, selectedKey, overrides, busy, embedded = false, onSelect, onApply, onReset, onBack,
  initialScrollTop, onScroll,
}: Props) {
  const artist = artists.find((item) => item.key === selectedKey) ?? artists[0];
  const [draft, setDraft] = useState<PythonArtistEdit>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current && initialScrollTop != null && initialScrollTop > 0) {
      containerRef.current.scrollTop = initialScrollTop;
    }
  }, [initialScrollTop]);

  useEffect(() => {
    setDraft(artist ? { ...(overrides[artist.key] ?? {}) } : {});
  }, [artist?.key, overrides]);
  if (!artist) return null;

  const set = (change: Partial<PythonArtistEdit>) => setDraft((current) => ({ ...current, ...change }));
  const numeric = (key: "alpha" | "lineWidth" | "markerSize" | "fontSize" | "zorder" | "vmin" | "vmax", value: string) => {
    set({ [key]: value === "" ? undefined : Number(value) });
  };
  const setProperty = (name: string, value: string | number | boolean) => {
    setDraft((current) => ({ ...current, properties: { ...current.properties, [name]: value } }));
  };
  const isText = ["text", "title", "xlabel", "ylabel"].includes(artist.kind);
  const canLine = ["line", "collection", "patch"].includes(artist.kind);

  return (
    <div
      ref={containerRef}
      className={embedded ? "artist-inspector embedded" : "inspector artist-inspector"}
      onScroll={(e) => onScroll?.(e.currentTarget.scrollTop)}
    >
      <div className="inspector-toolbar">
        <strong>Figure artists</strong>
        {onBack && <button className="btn small" type="button" onClick={onBack}>Chart style</button>}
      </div>
      <div className="section-body">
        <label className="ctl-row">
          <span className="ctl-label">Object</span>
          <span className="ctl-input">
            <select value={artist.key} onChange={(event) => onSelect(event.target.value)}>
              {artists.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.axisIndex + 1}: {item.label} ({item.kind})
                </option>
              ))}
            </select>
          </span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={draft.visible ?? artist.visible} onChange={(event) => set({ visible: event.target.checked })} />
          <span>Visible</span>
        </label>
        {artist.kind !== "legend" && artist.kind !== "image" && (
          <label className="ctl-row">
            <span className="ctl-label">Colour</span>
            <span className="ctl-input">
              <input value={draft.color ?? ""} onChange={(event) => set({ color: event.target.value })} placeholder={artist.color || "Source"} aria-label="Artist colour" />
            </span>
          </label>
        )}
        <label className="ctl-row">
          <span className="ctl-label">Opacity</span>
          <span className="ctl-input">
            <input type="number" min="0" max="1" step="0.05" value={draft.alpha ?? ""} onChange={(event) => numeric("alpha", event.target.value)} placeholder="Source" />
          </span>
        </label>
        {canLine && (
          <label className="ctl-row">
            <span className="ctl-label">Line width</span>
            <span className="ctl-input">
              <input type="number" min="0" step="0.5" value={draft.lineWidth ?? ""} onChange={(event) => numeric("lineWidth", event.target.value)} placeholder="Source" />
            </span>
          </label>
        )}
        {(artist.kind === "line" || artist.kind === "collection") && (
          <label className="ctl-row">
            <span className="ctl-label">Marker size</span>
            <span className="ctl-input">
              <input type="number" min="0" step="1" value={draft.markerSize ?? ""} onChange={(event) => numeric("markerSize", event.target.value)} placeholder="Source" />
            </span>
          </label>
        )}
        {isText && (
          <>
            <label className="ctl-row">
              <span className="ctl-label">Text</span>
              <span className="ctl-input">
                <input value={draft.text ?? ""} onChange={(event) => set({ text: event.target.value })} placeholder={artist.label} />
              </span>
            </label>
            <label className="ctl-row">
              <span className="ctl-label">Font size</span>
              <span className="ctl-input">
                <input type="number" min="1" step="1" value={draft.fontSize ?? ""} onChange={(event) => numeric("fontSize", event.target.value)} placeholder="Source" />
              </span>
            </label>
          </>
        )}
        {!isText && artist.kind !== "legend" && artist.kind !== "image" && (
          <label className="ctl-row">
            <span className="ctl-label">Legend label</span>
            <span className="ctl-input">
              <input value={draft.label ?? ""} onChange={(event) => set({ label: event.target.value })} placeholder={artist.label} />
            </span>
          </label>
        )}
        {(artist.kind === "image" || artist.kind === "collection") && (
          <>
            <label className="ctl-row">
              <span className="ctl-label">Gradient</span>
              <span className="ctl-input">
                <select value={draft.cmap ?? ""} onChange={(event) => set({ cmap: event.target.value || undefined })}>
                  <option value="">Source</option>
                  <option value="viridis">Viridis</option>
                  <option value="plasma">Plasma</option>
                  <option value="inferno">Inferno</option>
                  <option value="magma">Magma</option>
                  <option value="cividis">Cividis</option>
                  <option value="coolwarm">Coolwarm</option>
                  <option value="Greys">Greys</option>
                </select>
              </span>
            </label>
            <label className="ctl-row">
              <span className="ctl-label">Colour min</span>
              <span className="ctl-input">
                <input type="number" value={draft.vmin ?? ""} onChange={(event) => numeric("vmin", event.target.value)} placeholder="Source" />
              </span>
            </label>
            <label className="ctl-row">
              <span className="ctl-label">Colour max</span>
              <span className="ctl-input">
                <input type="number" value={draft.vmax ?? ""} onChange={(event) => numeric("vmax", event.target.value)} placeholder="Source" />
              </span>
            </label>
          </>
        )}
        <label className="ctl-row">
          <span className="ctl-label">Layer order</span>
          <span className="ctl-input">
            <input type="number" step="1" value={draft.zorder ?? ""} onChange={(event) => numeric("zorder", event.target.value)} placeholder="Source" />
          </span>
        </label>
        {artist.kind === "artist" && artist.properties && Object.keys(artist.properties).length > 0 && (
          <details className="artist-extra-properties">
            <summary>More object properties</summary>
            {Object.entries(artist.properties).map(([name, source]) => {
              const value = draft.properties?.[name] ?? source;
              return (
                <label className="ctl-row" key={name}>
                  <span className="ctl-label">{name.replace(/_/g, " ")}</span>
                  <span className="ctl-input">
                    {typeof source === "boolean" ? (
                      <input type="checkbox" checked={Boolean(value)} onChange={(event) => setProperty(name, event.target.checked)} />
                    ) : (
                      <input
                        type={typeof source === "number" ? "number" : "text"}
                        step={typeof source === "number" ? "any" : undefined}
                        value={String(value)}
                        onChange={(event) => setProperty(name, typeof source === "number" ? Number(event.target.value) : event.target.value)}
                      />
                    )}
                  </span>
                </label>
              );
            })}
          </details>
        )}
      </div>
      <div className="artist-inspector-actions">
        <button className="btn small" type="button" onClick={() => onReset(artist.key)} disabled={busy || !overrides[artist.key]}>Reset object</button>
        <button className="btn small primary" type="button" onClick={() => onApply(artist.key, draft)} disabled={busy}>
          {busy ? "Rendering..." : "Apply to figure"}
        </button>
      </div>
    </div>
  );
}
