import json as _iris_artist_json
import math as _iris_artist_math


def _iris_collect_artists(figure, output_path):
    """Describe editable artists in the exact tight PNG coordinate space."""
    from matplotlib.figure import Figure
    from matplotlib import rcParams

    if not isinstance(figure, Figure):
        return
    figure.canvas.draw()
    renderer = figure.canvas.get_renderer()
    tight = figure.get_tightbbox(renderer).padded(float(rcParams["savefig.pad_inches"]))
    left, bottom = tight.x0 * figure.dpi, tight.y0 * figure.dpi
    width, height = tight.width * figure.dpi, tight.height * figure.dpi
    if width <= 0 or height <= 0:
        return

    def point(x, y):
        return [(float(x) - left) / width, (bottom + height - float(y)) / height]

    def bounds(artist):
        try:
            box = artist.get_window_extent(renderer)
            if not all(_iris_artist_math.isfinite(v) for v in box.extents):
                return None
            a = point(box.x0, box.y1)
            b = point(box.x1, box.y0)
            return [a[0], a[1], b[0] - a[0], b[1] - a[1]]
        except Exception:
            return None

    def color(value):
        try:
            from matplotlib.colors import to_hex
            return to_hex(value)
        except Exception:
            return ""

    artists = []
    for axis_index, axis in enumerate(figure.axes):
        groups = (
            ("line", list(axis.lines)),
            ("collection", list(axis.collections)),
            ("patch", list(axis.patches)),
            ("text", list(axis.texts)),
            ("title", [axis.title]),
            ("image", list(axis.images)),
            ("table", list(axis.tables)),
            ("artist", list(axis.artists)),
            ("xlabel", [axis.xaxis.label]),
            ("ylabel", [axis.yaxis.label]),
            ("legend", [axis.get_legend()] if axis.get_legend() else []),
        )
        for kind, group in groups:
            for index, artist in enumerate(group[:500]):
                if len(artists) >= 1200:
                    break
                if artist is None:
                    continue
                label = str(artist.get_label() or "").strip()
                if label.startswith("_"):
                    label = ""
                if kind in ("text", "title", "xlabel", "ylabel"):
                    if not artist.get_text().strip():
                        continue
                    label = artist.get_text().strip() or label
                if kind == "legend":
                    label = "Legend"
                if not label:
                    label = f"{kind.title()} {index + 1}"
                entry = {
                    "key": f"{axis_index}:{kind}:{index}",
                    "axisIndex": axis_index,
                    "kind": kind,
                    "index": index,
                    "label": label[:120],
                    "bbox": bounds(artist),
                    "points": [],
                    "visible": bool(artist.get_visible()),
                    "color": "",
                }
                if kind == "artist":
                    excluded = {
                        "axes", "figure", "children", "transform", "clip_box", "clip_path",
                        "agg_filter", "path_effects", "sketch_params", "sticky_edges",
                        "label", "visible", "alpha", "zorder", "color", "text",
                    }
                    try:
                        properties = artist.properties()
                        editable = {}
                        for name, value in sorted(properties.items()):
                            if name in excluded or len(editable) >= 24:
                                continue
                            if not name.isidentifier() or not callable(getattr(artist, "set_" + name, None)):
                                continue
                            if type(value) in (str, bool, int, float) and len(str(value)) <= 120:
                                if not isinstance(value, float) or _iris_artist_math.isfinite(value):
                                    editable[name] = value
                        entry["properties"] = editable
                    except Exception:
                        entry["properties"] = {}
                try:
                    if kind == "line":
                        entry["color"] = color(artist.get_color())
                        vertices = artist.get_path().transformed(artist.get_transform()).vertices
                        stride = max(1, len(vertices) // 240)
                        entry["points"] = [point(x, y) for x, y in vertices[::stride]
                                           if _iris_artist_math.isfinite(x) and _iris_artist_math.isfinite(y)]
                    elif kind == "collection":
                        colors = artist.get_facecolors()
                        entry["color"] = color(colors[0]) if len(colors) else ""
                        offsets = artist.get_offsets()
                        if len(offsets):
                            vertices = artist.get_offset_transform().transform(offsets)
                            stride = max(1, len(vertices) // 240)
                            entry["points"] = [point(x, y) for x, y in vertices[::stride]
                                               if _iris_artist_math.isfinite(x) and _iris_artist_math.isfinite(y)]
                    elif kind == "patch":
                        entry["color"] = color(artist.get_facecolor())
                    elif kind in ("text", "title", "xlabel", "ylabel"):
                        entry["color"] = color(artist.get_color())
                except Exception:
                    pass
                if entry["bbox"] or entry["points"] or not entry["visible"]:
                    artists.append(entry)
    with open(output_path + ".artists.json", "w", encoding="utf-8") as handle:
        _iris_artist_json.dump(artists[:1200], handle)


try:
    if _iris_os.environ.get("IRIS_COLLECT_ARTISTS") == "1":
        _iris_source_figure = _iris_find_figure(globals())
        if _iris_source_figure is None:
            _iris_source_figure = globals().get("fig") or globals().get("chart") or globals().get("figure")
        if _iris_source_figure is not None:
            if hasattr(_iris_source_figure, "fig") and hasattr(_iris_source_figure.fig, "axes"):
                _iris_source_figure = _iris_source_figure.fig
            elif hasattr(_iris_source_figure, "figure") and hasattr(_iris_source_figure.figure, "axes"):
                _iris_source_figure = _iris_source_figure.figure
        if _iris_source_figure is None and plt is not None:
            _iris_source_figure = plt.gcf()
        _iris_collect_artists(_iris_source_figure, _IRIS_TARGET)
except Exception:
    # Metadata must never turn a successful figure render into an error.
    pass
