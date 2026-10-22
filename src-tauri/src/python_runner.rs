use base64::Engine;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;
use crate::types::{RResult, RenderResult};
use crate::utils::{unique_tmp, RenderWorkDir, run_command_with_timeout};
use crate::python_env::{ensure_python_renderer, python_host_bootstrap};

/// Run an arbitrary Python script in Iris' managed renderer environment and capture stdout/stderr.
#[tauri::command]
pub fn run_python_script(script: String) -> RResult {
    let path = unique_tmp("py");
    let full = format!("{}{}", python_host_bootstrap(), script);
    if let Err(e) = std::fs::write(&path, full.as_bytes()) {
        return RResult {
            stdout: String::new(),
            stderr: format!("Failed to write temp Python script: {e}"),
            success: false,
        };
    }
    let python = match ensure_python_renderer() {
        Ok(path) => path,
        Err(e) => {
            let _ = std::fs::remove_file(&path);
            return RResult {
                stdout: String::new(),
                stderr: e,
                success: false,
            };
        }
    };
    let mpl_config = std::env::temp_dir().join("iris-matplotlib");
    let _ = std::fs::create_dir_all(&mpl_config);
    let mut command = Command::new(&python);
    command
        .arg(&path)
        .env("MPLCONFIGDIR", &mpl_config)
        .current_dir(std::env::temp_dir());
    let output = run_command_with_timeout(command, Duration::from_secs(90));
    let _ = std::fs::remove_file(&path);
    match output {
        Ok(o) => RResult {
            stdout: String::from_utf8_lossy(&o.stdout).to_string(),
            stderr: String::from_utf8_lossy(&o.stderr).to_string(),
            success: o.status.success(),
        },
        Err(e) => RResult {
            stdout: String::new(),
            stderr: format!("Python script failed at '{}': {e}", python.to_string_lossy()),
            success: false,
        },
    }
}


pub fn read_python_artists(target: &Path) -> Vec<serde_json::Value> {
    let sidecar = PathBuf::from(format!("{}.artists.json", target.display()));
    let artists = std::fs::read_to_string(&sidecar)
        .ok()
        .and_then(|text| serde_json::from_str::<Vec<serde_json::Value>>(&text).ok())
        .unwrap_or_default();
    let _ = std::fs::remove_file(sidecar);
    artists
}

#[tauri::command]
pub fn render_python_plot(
    code: String,
    format: String,
    width: f64,
    height: f64,
    dpi: f64,
    save_path: Option<String>,
) -> RenderResult {
    let fmt = format.to_lowercase();
    let target: PathBuf = match &save_path {
        Some(p) => PathBuf::from(p),
        None => unique_tmp(&fmt),
    };
    let target_str = target.to_string_lossy().replace('\\', "/");
    let out_json = serde_json::to_string(&target_str).unwrap_or_else(|_| format!("\"{}\"", target_str));

    let mut kept: Vec<&str> = code.lines().collect();
    while kept.last().map(|l| l.trim().is_empty()).unwrap_or(false) {
        kept.pop();
    }
    if kept.last().map(|l| l.trim()) == Some("plt.show()") {
        kept.pop();
    }
    let code = kept.join("\n");

    let mut full = format!(
        "{bootstrap}import matplotlib\nmatplotlib.use('Agg')\n{code}\n_IRIS_TARGET = {out}\n_IRIS_WIDTH = {w}\n_IRIS_HEIGHT = {h}\n_IRIS_DPI = {dpi}\ntry:\n    import matplotlib.pyplot as plt\nexcept Exception:\n    plt = None\n_iris_saved = False\n_iris_errors = []\n_iris_cands = [_iris_find_figure(globals())] + [globals().get(_n) for _n in ('fig', 'chart', 'figure', 'g', 'f', 'plot', 'grid')]\nfor _iris_cand in _iris_cands:\n    if _iris_cand is None:\n        continue\n    _iris_obj = _iris_cand\n    if hasattr(_iris_obj, 'fig') and (hasattr(_iris_obj.fig, 'savefig') or hasattr(_iris_obj.fig, 'canvas')):\n        _iris_obj = _iris_obj.fig\n    elif hasattr(_iris_obj, 'figure') and (hasattr(_iris_obj.figure, 'savefig') or hasattr(_iris_obj.figure, 'canvas')):\n        _iris_obj = _iris_obj.figure\n    try:\n        if hasattr(_iris_obj, 'set_size_inches'):\n            _iris_obj.set_size_inches(_IRIS_WIDTH, _IRIS_HEIGHT)\n        if hasattr(_iris_obj, 'set_dpi'):\n            _iris_obj.set_dpi(_IRIS_DPI)\n        if hasattr(_iris_obj, 'savefig'):\n            _iris_obj.savefig(_IRIS_TARGET, dpi=_IRIS_DPI, bbox_inches='tight', facecolor='white')\n            _iris_saved = True\n            break\n        if hasattr(_iris_obj, 'write_image'):\n            _iris_obj.write_image(_IRIS_TARGET, width=int(_IRIS_WIDTH * _IRIS_DPI), height=int(_IRIS_HEIGHT * _IRIS_DPI), scale=1)\n            _iris_saved = True\n            break\n        if hasattr(_iris_obj, 'save'):\n            _iris_obj.save(_IRIS_TARGET)\n            _iris_saved = True\n            break\n    except Exception as exc:\n        _iris_errors.append(str(exc))\nif not _iris_saved and plt is not None:\n    try:\n        _iris_fig = plt.gcf()\n        if _iris_fig.get_axes():\n            _iris_fig.set_size_inches(_IRIS_WIDTH, _IRIS_HEIGHT)\n            _iris_fig.set_dpi(_IRIS_DPI)\n            _iris_fig.savefig(_IRIS_TARGET, dpi=_IRIS_DPI, bbox_inches='tight', facecolor='white')\n            _iris_saved = True\n        else:\n            _iris_errors.append('the current matplotlib figure is empty (no axes)')\n    except Exception as exc:\n        _iris_errors.append(str(exc))\nif not _iris_saved:\n    # Some self-contained publication scripts save their output files and\n    # close every figure before Iris inspects the namespace. In that case,\n    # adopt the newest image produced in the renderer working directory.\n    import os as _iris_os\n    import shutil as _iris_shutil\n    _iris_candidates = []\n    _iris_ext = _iris_os.path.splitext(_IRIS_TARGET)[1].lower()\n    _iris_valid_exts = {{'.jpg', '.jpeg'}} if _iris_ext in ('.jpg', '.jpeg') else {{_iris_ext}}\n    for _iris_name in _iris_os.listdir(_iris_os.getcwd()):\n        if _iris_os.path.splitext(_iris_name)[1].lower() in _iris_valid_exts:\n            _iris_path = _iris_os.path.join(_iris_os.getcwd(), _iris_name)\n            if _iris_path != _IRIS_TARGET and _iris_os.path.isfile(_iris_path) and _iris_os.stat(_iris_path).st_mtime_ns >= _IRIS_RENDER_STARTED_NS:\n                _iris_candidates.append(_iris_path)\n    if _iris_candidates:\n        _iris_source = max(_iris_candidates, key=_iris_os.path.getmtime)\n        _iris_shutil.copyfile(_iris_source, _IRIS_TARGET)\n        _iris_saved = True\nif not _iris_saved:\n    raise RuntimeError('No figure to render. Expose a top-level object named `fig` or `chart`, leave a drawn matplotlib figure open, or save a PNG/JPEG/SVG output file.')\n",
        bootstrap = python_host_bootstrap(),
        code = code,
        out = out_json,
        w = width,
        h = height,
        dpi = dpi
    );
    full.push_str(include_str!("artist_metadata.py"));

    let script_path = unique_tmp("py");
    if let Err(e) = std::fs::write(&script_path, full.as_bytes()) {
        return RenderResult {
            success: false,
            stderr: format!("Failed to write temp Python script: {e}"),
            format: fmt,
            data: String::new(),
            saved_to: None,
            artists: vec![],
        };
    }
    let python = match ensure_python_renderer() {
        Ok(path) => path,
        Err(e) => {
            let _ = std::fs::remove_file(&script_path);
            return RenderResult {
                success: false,
                stderr: e,
                format: fmt,
                data: String::new(),
                saved_to: None,
            artists: vec![],
            };
        }
    };
    let work_dir = match RenderWorkDir::new() { Ok(dir) => dir, Err(e) => return RenderResult { success: false, stderr: e, format: fmt, data: String::new(), saved_to: None, artists: vec![] } };
    let mpl_config = std::env::temp_dir().join("iris-matplotlib");
    let _ = std::fs::create_dir_all(&mpl_config);
    let mut command = Command::new(&python);
    command
        .arg(&script_path)
        .env("MPLCONFIGDIR", &mpl_config)
        .env("IRIS_COLLECT_ARTISTS", if save_path.is_none() && fmt == "png" { "1" } else { "0" })
        .current_dir(work_dir.path());
    let output = run_command_with_timeout(command, Duration::from_secs(90));
    let _ = std::fs::remove_file(&script_path);

    let (success, stderr) = match output {
        Ok(o) => (
            o.status.success(),
            String::from_utf8_lossy(&o.stderr).to_string(),
        ),
        Err(e) => (false, format!("Python renderer failed at '{}': {e}", python.to_string_lossy())),
    };

    if !success || !target.exists() {
        return RenderResult {
            success: false,
            stderr: if stderr.is_empty() {
                "Python produced no output figure. Iris uses a managed Python environment with numpy, pandas, matplotlib, seaborn, plotly, kaleido, altair, and vl-convert-python.".to_string()
            } else {
                stderr
            },
            format: fmt,
            data: String::new(),
            saved_to: None,
            artists: vec![],
        };
    }

    let artists = if save_path.is_none() && fmt == "png" {
        read_python_artists(&target)
    } else {
        vec![]
    };
    if save_path.is_some() {
        return RenderResult {
            success: true,
            stderr,
            format: fmt,
            data: String::new(),
            saved_to: Some(target_str),
            artists,
        };
    }

    match std::fs::read(&target) {
        Ok(bytes) => {
            let data = base64::engine::general_purpose::STANDARD.encode(&bytes);
            let _ = std::fs::remove_file(&target);
            RenderResult {
                success: true,
                stderr,
                format: fmt,
                data,
                saved_to: None,
                artists,
            }
        }
        Err(e) => RenderResult {
            success: false,
            stderr: format!("Rendered Python file could not be read: {e}"),
            format: fmt,
            data: String::new(),
            saved_to: None,
            artists: vec![],
        },
    }
}
