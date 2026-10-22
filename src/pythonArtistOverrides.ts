export interface PythonArtistEdit {
  visible?: boolean;
  color?: string;
  alpha?: number;
  lineWidth?: number;
  markerSize?: number;
  fontSize?: number;
  cmap?: string;
  vmin?: number;
  vmax?: number;
  text?: string;
  label?: string;
  zorder?: number;
  properties?: Record<string, string | number | boolean>;
}

export function stripPythonArtistOverrides(code: string): string {
  return code.replace(/\n# --- Iris artist overrides ---[\s\S]*?# --- end Iris artist overrides ---\n?/, "");
}

export function pythonArtistOverrideCode(overrides: Record<string, PythonArtistEdit>): string {
  const valid = Object.fromEntries(
    Object.entries(overrides).filter(([key]) => /^\d+:(line|collection|patch|text|title|xlabel|ylabel|legend|image|table|artist):\d+$/.test(key)),
  );
  if (!Object.keys(valid).length) return "";
  const literal = JSON.stringify(JSON.stringify(valid));
  return `
# --- Iris artist overrides ---
import json as _iris_artist_json
_iris_artist_edits = _iris_artist_json.loads(${literal})
try:
    import matplotlib.pyplot as _iris_artist_plt
    _iris_artist_fig = globals().get("fig") or globals().get("chart") or _iris_artist_plt.gcf()
    for _iris_key, _iris_edit in _iris_artist_edits.items():
        _iris_artist = None
        try:
            _iris_axis_index, _iris_kind, _iris_index = _iris_key.split(":")
            _iris_ax = _iris_artist_fig.axes[int(_iris_axis_index)]
            _iris_group = {
                "line": list(_iris_ax.lines),
                "collection": list(_iris_ax.collections),
                "patch": list(_iris_ax.patches),
                "image": list(_iris_ax.images),
                "table": list(_iris_ax.tables),
                "artist": list(_iris_ax.artists),
                "text": list(_iris_ax.texts),
                "title": [_iris_ax.title],
                "xlabel": [_iris_ax.xaxis.label],
                "ylabel": [_iris_ax.yaxis.label],
                "legend": [_iris_ax.get_legend()] if _iris_ax.get_legend() else [],
            }.get(_iris_kind, [])
            _iris_artist = _iris_group[int(_iris_index)]
            if "visible" in _iris_edit:
                _iris_artist.set_visible(bool(_iris_edit["visible"]))
            if _iris_edit.get("color"):
                if _iris_kind == "patch":
                    _iris_artist.set_facecolor(_iris_edit["color"])
                elif _iris_kind == "collection":
                    _iris_artist.set_color(_iris_edit["color"])
                elif hasattr(_iris_artist, "set_color"):
                    _iris_artist.set_color(_iris_edit["color"])
            if "alpha" in _iris_edit:
                _iris_artist.set_alpha(float(_iris_edit["alpha"]))
            if "lineWidth" in _iris_edit and hasattr(_iris_artist, "set_linewidth"):
                _iris_artist.set_linewidth(float(_iris_edit["lineWidth"]))
            if "markerSize" in _iris_edit:
                if _iris_kind == "collection" and hasattr(_iris_artist, "set_sizes"):
                    _iris_artist.set_sizes([float(_iris_edit["markerSize"]) ** 2])
                elif hasattr(_iris_artist, "set_markersize"):
                    _iris_artist.set_markersize(float(_iris_edit["markerSize"]))
            if _iris_kind == "image" or _iris_kind == "collection":
                if _iris_edit.get("cmap") and hasattr(_iris_artist, "set_cmap"):
                    _iris_artist.set_cmap(_iris_edit["cmap"])
                if ("vmin" in _iris_edit or "vmax" in _iris_edit) and hasattr(_iris_artist, "get_clim") and hasattr(_iris_artist, "set_clim"):
                    try:
                        _iris_min, _iris_max = _iris_artist.get_clim()
                        _iris_artist.set_clim(_iris_edit.get("vmin", _iris_min), _iris_edit.get("vmax", _iris_max))
                    except Exception:
                        pass
            if "fontSize" in _iris_edit and hasattr(_iris_artist, "set_fontsize"):
                _iris_artist.set_fontsize(float(_iris_edit["fontSize"]))
            if "text" in _iris_edit and hasattr(_iris_artist, "set_text"):
                _iris_artist.set_text(str(_iris_edit["text"]))
            if "label" in _iris_edit and hasattr(_iris_artist, "set_label"):
                _iris_old_label = _iris_artist.get_label()
                _iris_artist.set_label(str(_iris_edit["label"]))
                _iris_legend = _iris_ax.get_legend()
                if _iris_legend is not None:
                    for _iris_legend_text in _iris_legend.get_texts():
                        if _iris_legend_text.get_text() == _iris_old_label:
                            _iris_legend_text.set_text(str(_iris_edit["label"]))
                            break
            if "zorder" in _iris_edit:
                _iris_artist.set_zorder(float(_iris_edit["zorder"]))
            for _iris_property, _iris_value in _iris_edit.get("properties", {}).items():
                if _iris_property.isidentifier() and not _iris_property.startswith("_"):
                    _iris_setter = getattr(_iris_artist, "set_" + _iris_property, None)
                    if callable(_iris_setter):
                        _iris_setter(_iris_value)
        except (IndexError, ValueError, AttributeError, TypeError):
            if _iris_artist is not None:
                raise
            continue
except ImportError:
    pass
# --- end Iris artist overrides ---
`;
}
