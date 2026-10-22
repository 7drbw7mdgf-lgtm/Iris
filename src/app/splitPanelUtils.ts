import { LiveSplitPanel } from "./types";

export function splitPanelOverrideCode(panels: LiveSplitPanel[]): string {
  const overrides = panels
    .filter(
      (panel) =>
        panel.graphTitle ||
        panel.xLabel ||
        panel.yLabel ||
        panel.hideTitle ||
        panel.hideXLabel ||
        panel.hideYLabel ||
        panel.hideLegend ||
        panel.xScale !== "linear" ||
        panel.yScale !== "linear" ||
        panel.traceColor ||
        panel.lineWidth !== 0 ||
        panel.markerSize !== 0
    )
    .map((panel) => ({
      axisIndex: panel.axisIndex,
      title: panel.graphTitle,
      xLabel: panel.xLabel,
      yLabel: panel.yLabel,
      hideTitle: panel.hideTitle,
      hideXLabel: panel.hideXLabel,
      hideYLabel: panel.hideYLabel,
      hideLegend: panel.hideLegend,
      xScale: panel.xScale,
      yScale: panel.yScale,
      traceColor: panel.traceColor,
      lineWidth: panel.lineWidth,
      markerSize: panel.markerSize,
    }));
  if (!overrides.length) return "";
  const json = JSON.stringify(overrides).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `\n# --- Iris split-panel overrides ---\nimport json as _iris_split_json\n_iris_split_overrides = _iris_split_json.loads('${json}')\ntry:\n    import matplotlib.pyplot as _iris_split_plt\nexcept Exception:\n    _iris_split_plt = None\n_iris_split_fig = globals().get('fig') or globals().get('chart')\nif _iris_split_fig is None and _iris_split_plt is not None:\n    _iris_split_fig = _iris_split_plt.gcf()\nif _iris_split_fig is not None:\n    for _iris_ov in _iris_split_overrides:\n        try:\n            _iris_ax = list(getattr(_iris_split_fig, 'axes', []))[int(_iris_ov.get('axisIndex', -1))]\n        except Exception:\n            continue\n        if _iris_ov.get('hideTitle'):\n            _iris_ax.set_title('')\n        elif _iris_ov.get('title') is not None:\n            _iris_ax.set_title(_iris_ov.get('title') or '')\n        if _iris_ov.get('hideXLabel'):\n            _iris_ax.set_xlabel('')\n        elif _iris_ov.get('xLabel') is not None:\n            _iris_ax.set_xlabel(_iris_ov.get('xLabel') or '')\n        if _iris_ov.get('hideYLabel'):\n            _iris_ax.set_ylabel('')\n        elif _iris_ov.get('yLabel') is not None:\n            _iris_ax.set_ylabel(_iris_ov.get('yLabel') or '')\n        if _iris_ov.get('xScale') in ('linear', 'log'):\n            _iris_ax.set_xscale(_iris_ov.get('xScale'))\n        if _iris_ov.get('yScale') in ('linear', 'log'):\n            _iris_ax.set_yscale(_iris_ov.get('yScale'))\n        if _iris_ov.get('hideLegend'):\n            _iris_leg = _iris_ax.get_legend()\n            if _iris_leg is not None:\n                _iris_leg.set_visible(False)\n        _iris_color = _iris_ov.get('traceColor') or ''\n        _iris_lw = float(_iris_ov.get('lineWidth') or 0)\n        _iris_ms = float(_iris_ov.get('markerSize') or 0)\n        for _iris_line in list(getattr(_iris_ax, 'lines', [])):\n            if _iris_color:\n                _iris_line.set_color(_iris_color)\n            if _iris_lw > 0:\n                _iris_line.set_linewidth(_iris_lw)\n            if _iris_ms > 0:\n                _iris_line.set_markersize(_iris_ms)\n        for _iris_collection in list(getattr(_iris_ax, 'collections', [])):\n            if _iris_color:\n                try:\n                    _iris_collection.set_facecolor(_iris_color)\n                    _iris_collection.set_edgecolor(_iris_color)\n                except Exception:\n                    pass\n            if _iris_ms > 0:\n                try:\n                    _iris_collection.set_sizes([_iris_ms * _iris_ms])\n                except Exception:\n                    pass\n# --- end Iris split-panel overrides ---\n`;
}

export function splitPanelLayoutOverrideCode(panels: LiveSplitPanel[]): string {
  const width = panels.reduce((max, panel) => Math.max(max, panel.x + panel.w + 48), 900);
  const height = panels.reduce((max, panel) => Math.max(max, panel.y + panel.h + 48), 560);
  const layout = panels.map((panel) => ({ axisIndex: panel.axisIndex, x: panel.x, y: panel.y, w: panel.w, h: panel.h }));
  const json = JSON.stringify({ width, height, layout }).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `\n# --- Iris split-panel layout ---\nimport json as _iris_split_json\ntry:\n    import matplotlib.pyplot as _iris_split_plt\nexcept Exception:\n    _iris_split_plt = None\n_iris_split_fig = globals().get('fig') or globals().get('chart')\nif _iris_split_fig is None and _iris_split_plt is not None:\n    _iris_split_fig = _iris_split_plt.gcf()\n_iris_split_layout = _iris_split_json.loads('${json}')\nif _iris_split_fig is not None:\n    _iris_fig_w, _iris_fig_h = _iris_split_layout['width'], _iris_split_layout['height']\n    for _iris_layout in _iris_split_layout['layout']:\n        try:\n            _iris_layout_ax = list(getattr(_iris_split_fig, 'axes', []))[int(_iris_layout.get('axisIndex', -1))]\n            _iris_layout_ax.set_position([_iris_layout['x'] / _iris_fig_w, 1 - ((_iris_layout['y'] + _iris_layout['h']) / _iris_fig_h), _iris_layout['w'] / _iris_fig_w, _iris_layout['h'] / _iris_fig_h])\n        except Exception:\n            continue\n# --- end Iris split-panel layout ---\n`;
}
