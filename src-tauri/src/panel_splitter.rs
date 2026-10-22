use base64::Engine;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, SystemTime};
use crate::types::{SplitPanelResult, SplitPanelsResult};
use crate::utils::{unique_tmp, RenderWorkDir, run_command_with_timeout};
use crate::python_env::{ensure_python_renderer, python_host_bootstrap};

pub fn collect_recent_saved_panels(root: &Path, started: SystemTime) -> Vec<SplitPanelResult> {
    fn visit(dir: &Path, started: SystemTime, found: &mut Vec<PathBuf>, depth: usize) {
        if depth > 3 { return; }
        let entries = match std::fs::read_dir(dir) { Ok(entries) => entries, Err(_) => return };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                visit(&path, started, found, depth + 1);
                continue;
            }
            let name = match path.file_name().and_then(|v| v.to_str()) { Some(name) => name.to_lowercase(), None => continue };
            if !name.starts_with("panel") || !name.ends_with(".png") { continue; }
            let recent = path.metadata().and_then(|m| m.modified()).ok()
                .and_then(|modified| modified.duration_since(started).ok())
                .map(|elapsed| elapsed < Duration::from_secs(120)).unwrap_or(false);
            if recent { found.push(path); }
        }
    }
    let mut paths = Vec::new();
    visit(root, started, &mut paths, 0);
    paths.sort();
    paths.into_iter().enumerate().filter_map(|(index, path)| {
        let data = std::fs::read(&path).ok()?;
        let title = path.file_stem()?.to_string_lossy().to_string();
        Some(SplitPanelResult {
            title: title.clone(),
            graph_title: title,
            axis_index: index,
            x_label: String::new(),
            y_label: String::new(),
            data: base64::engine::general_purpose::STANDARD.encode(data),
        })
    }).collect()
}

#[tauri::command]
pub fn split_python_figure_panels(code: String, dpi: f64) -> SplitPanelsResult {
    let split_started = std::time::SystemTime::now();
    let work_dir = match RenderWorkDir::new() { Ok(dir) => dir, Err(e) => return SplitPanelsResult { success: false, stderr: e, panels: vec![] } };
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let out_dir = std::env::temp_dir().join(format!("iris_split_{stamp}"));
    if let Err(e) = std::fs::create_dir_all(&out_dir) {
        return SplitPanelsResult {
            success: false,
            stderr: format!("Could not create split output directory: {e}"),
            panels: vec![],
        };
    }
    let out_dir_str = out_dir.to_string_lossy().replace('\\', "/");
    let out_dir_json = serde_json::to_string(&out_dir_str).unwrap_or_else(|_| format!("\"{}\"", out_dir_str));
    // Keep source figures alive while splitting. Many publication scripts
    // close each panel after saving it, which otherwise leaves no axes for
    // the right-rail detail overrides to modify.
    let code = format!(
        "import matplotlib.pyplot as _iris_split_keep_plt\ndef _iris_split_no_close(*_args, **_kwargs):\n    pass\n_iris_split_keep_plt.close = _iris_split_no_close\n{}",
        code
    );
    let full = format!(
        "{bootstrap}import matplotlib\nmatplotlib.use('Agg')\n{code}\nimport json as _iris_json\nimport os as _iris_os\ntry:\n    import matplotlib.pyplot as plt\nexcept Exception:\n    plt = None\n_fig = _iris_find_figure(globals())\nif _fig is None:\n    _fig = globals().get('fig') or globals().get('chart') or globals().get('figure')\nif _fig is not None:\n    if hasattr(_fig, 'fig') and hasattr(_fig.fig, 'axes'):\n        _fig = _fig.fig\n    elif hasattr(_fig, 'figure') and hasattr(_fig.figure, 'axes'):\n        _fig = _fig.figure\nif _fig is None and plt is not None:\n    _fig = plt.gcf()\nif _fig is None:\n    raise RuntimeError('No matplotlib figure found to split.')\n_fig.canvas.draw()\n_renderer = _fig.canvas.get_renderer()\n_panels = []\n_seen = set()\nfor _idx, _ax in enumerate(list(getattr(_fig, 'axes', []))):\n    _pos = _ax.get_position()\n    if _pos.width < 0.12 or _pos.height < 0.12:\n        continue\n    try:\n        _has_data = bool(_ax.has_data())\n    except Exception:\n        _has_data = False\n    if not (_has_data or _ax.get_title() or _ax.get_xlabel() or _ax.get_ylabel()):\n        continue\n    try:\n        _bbox = _ax.get_tightbbox(_renderer).expanded(1.18, 1.24).transformed(_fig.dpi_scale_trans.inverted())\n        _path = _iris_os.path.join({out_dir}, f'panel_{{len(_panels)+1}}.png')\n        _fig.savefig(_path, dpi={dpi}, bbox_inches=_bbox, pad_inches=0.06, facecolor='white')\n        _graph_title = (_ax.get_title() or '').strip()\n        _title = (_graph_title or _ax.get_label() or f'Panel {{len(_panels)+1}}').strip()\n        if not _title or _title in _seen:\n            _title = f'Panel {{len(_panels)+1}}'\n        _seen.add(_title)\n        _panels.append({{'title': _title, 'graphTitle': _graph_title, 'axisIndex': _idx, 'xLabel': _ax.get_xlabel() or '', 'yLabel': _ax.get_ylabel() or '', 'path': _path}})\n    except Exception:\n        continue\nif len(_panels) <= 1:\n    _panels = []\n    _saved_panels = []\n    for _name in _iris_os.listdir(_iris_os.getcwd()):\n        _lower = _name.lower()\n        if _lower.startswith('panel') and _lower.endswith('.png'):\n            _path = _iris_os.path.join(_iris_os.getcwd(), _name)\n            if _iris_os.path.isfile(_path) and _iris_os.stat(_path).st_mtime_ns >= _IRIS_RENDER_STARTED_NS:\n                _saved_panels.append(_path)\n    for _path in sorted(_saved_panels):\n        _label = _iris_os.path.splitext(_iris_os.path.basename(_path))[0]\n        _panels.append({{'title': _label, 'graphTitle': _label, 'axisIndex': len(_panels), 'xLabel': '', 'yLabel': '', 'path': _path}})\nif len(_panels) <= 1:\n    raise RuntimeError(f'Only {{len(_panels)}} subplot panel was detected. The script may need visible matplotlib axes or saved panel images.')\nprint(_iris_json.dumps(_panels))\n",
        bootstrap = python_host_bootstrap(),
        code = code,
        out_dir = out_dir_json,
        dpi = dpi
    );

    let script_path = unique_tmp("py");
    if let Err(e) = std::fs::write(&script_path, full.as_bytes()) {
        let _ = std::fs::remove_dir_all(&out_dir);
        return SplitPanelsResult {
            success: false,
            stderr: format!("Failed to write split temp Python script: {e}"),
            panels: vec![],
        };
    }
    let python = match ensure_python_renderer() {
        Ok(path) => path,
        Err(e) => {
            let _ = std::fs::remove_file(&script_path);
            let _ = std::fs::remove_dir_all(&out_dir);
            return SplitPanelsResult { success: false, stderr: e, panels: vec![] };
        }
    };
    let mpl_config = std::env::temp_dir().join("iris-matplotlib");
    let _ = std::fs::create_dir_all(&mpl_config);
    let mut command = Command::new(&python);
    command
        .arg(&script_path)
        .env("MPLCONFIGDIR", &mpl_config)
        .current_dir(work_dir.path());
    let output = run_command_with_timeout(command, Duration::from_secs(95));
    let _ = std::fs::remove_file(&script_path);

    let output = match output {
        Ok(o) => o,
        Err(e) => {
            let _ = std::fs::remove_dir_all(&out_dir);
            return SplitPanelsResult {
                success: false,
                stderr: format!("Python split renderer failed at '{}': {e}", python.to_string_lossy()),
                panels: vec![],
            };
        }
    };
    if !output.status.success() {
        let _ = std::fs::remove_dir_all(&out_dir);
        return SplitPanelsResult {
            success: false,
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            panels: vec![],
        };
    }
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let json_line = stdout
        .lines()
        .rev()
        .find(|line| line.trim_start().starts_with('['))
        .unwrap_or("");
    let entries: Vec<serde_json::Value> = match serde_json::from_str(json_line) {
        Ok(entries) => entries,
        Err(e) => {
            let _ = std::fs::remove_dir_all(&out_dir);
            return SplitPanelsResult {
                success: false,
                stderr: format!("Could not read split panel metadata: {e}"),
                panels: vec![],
            };
        }
    };
    let mut panels = Vec::new();
    for entry in entries {
        let title = entry.get("title").and_then(|v| v.as_str()).unwrap_or("Panel").to_string();
        let graph_title = entry.get("graphTitle").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let axis_index = entry.get("axisIndex").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
        let x_label = entry.get("xLabel").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let y_label = entry.get("yLabel").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let path = entry.get("path").and_then(|v| v.as_str()).unwrap_or("");
        if path.is_empty() {
            continue;
        }
        if let Ok(bytes) = std::fs::read(path) {
            panels.push(SplitPanelResult {
                title,
                graph_title,
                axis_index,
                x_label,
                y_label,
                data: base64::engine::general_purpose::STANDARD.encode(&bytes),
            });
        }
    }
    let _ = std::fs::remove_dir_all(&out_dir);
    if panels.len() <= 1 {
        let saved_panels = collect_recent_saved_panels(work_dir.path(), split_started);
        if saved_panels.len() > 1 {
            return SplitPanelsResult {
                success: true,
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                panels: saved_panels,
            };
        }
        return SplitPanelsResult {
            success: false,
            stderr: "Only one split panel image was produced.".to_string(),
            panels,
        };
    }
    SplitPanelsResult {
        success: true,
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        panels,
    }
}


