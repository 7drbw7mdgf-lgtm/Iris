use std::path::{Path, PathBuf};
use std::process::Command;
use crate::types::RResult;

pub fn find_system_python() -> String {
    if let Ok(p) = std::env::var("IRIS_PYTHON") {
        if !p.is_empty() {
            return p;
        }
    }
    let home = std::env::var("HOME").unwrap_or_default();
    let candidates = [
        "/opt/anaconda3/bin/python3".to_string(),
        "/opt/miniconda3/bin/python3".to_string(),
        format!("{home}/anaconda3/bin/python3"),
        format!("{home}/miniconda3/bin/python3"),
        format!("{home}/opt/anaconda3/bin/python3"),
        format!("{home}/opt/miniconda3/bin/python3"),
        "/opt/homebrew/bin/python3".to_string(),
        "/usr/local/bin/python3".to_string(),
        "/usr/bin/python3".to_string(),
        "python3".to_string(),
    ];
    for c in &candidates {
        if c == "python3" || Path::new(c).exists() {
            return c.clone();
        }
    }
    "python3".to_string()
}

pub fn iris_venv_dir() -> PathBuf {
    if let Ok(p) = std::env::var("IRIS_PYTHON_VENV") {
        if !p.is_empty() {
            return PathBuf::from(p);
        }
    }
    let home = std::env::var("HOME").unwrap_or_else(|_| std::env::temp_dir().to_string_lossy().to_string());
    PathBuf::from(home)
        .join("Library")
        .join("Application Support")
        .join("Iris")
        .join("python-venv")
}

pub fn iris_venv_python_path(venv: &Path) -> PathBuf {
    venv.join("bin").join("python")
}

pub fn python_host_bootstrap() -> &'static str {
    r#"
import sys as _iris_sys
import types as _iris_types
import os as _iris_os
import re as _iris_re
from pathlib import Path as _IrisPath

class _IrisHostModule(_iris_types.ModuleType):
    def artifact_path(self, artifact_id):
        key = "" if artifact_id is None else str(artifact_id)
        if not key:
            raise FileNotFoundError("Iris could not resolve host.artifact_path(): the script passed an empty artifact id.")
        direct = _IrisPath(key).expanduser()
        if direct.exists():
            return str(direct)
        env_key = "IRIS_ARTIFACT_" + _iris_re.sub(r"[^A-Za-z0-9_]", "_", key).upper()
        env_path = _iris_os.environ.get(env_key)
        if env_path and _IrisPath(env_path).expanduser().exists():
            return str(_IrisPath(env_path).expanduser())
        roots = []
        for part in _iris_os.environ.get("IRIS_ARTIFACT_DIRS", "").split(_iris_os.pathsep):
            if part:
                roots.append(_IrisPath(part).expanduser())
        roots.append(_IrisPath.cwd())
        needles = {key, _IrisPath(key).name, _IrisPath(key).stem}
        scanned = 0
        for root in roots:
            if not root.exists():
                continue
            for candidate in root.glob("*"):
                scanned += 1
                if scanned > 1000:
                    break
                if not candidate.is_file():
                    continue
                name = candidate.name
                stem = candidate.stem
                if key in name or name in needles or stem in needles:
                    return str(candidate)
            if scanned > 1000:
                break
        raise FileNotFoundError(
            "Iris could not resolve host.artifact_path(%r). This script references a data artifact from its source host, "
            "but that artifact is not available as a local file. Download/export the CSV or set IRIS_ARTIFACT_DIRS to the folder containing it, "
            "then rerun the script." % key
        )

    def __getattr__(self, name):
        def _iris_noop(*args, **kwargs):
            print(f"[Iris warning] Ignored host.{name} call; Iris runs scripts outside the source host environment.", file=_iris_sys.stderr)
            return None
        return _iris_noop

if "host" not in _iris_sys.modules:
    _iris_sys.modules["host"] = _IrisHostModule("host")

def apply_figure_style(fig=None, ax=None, **kwargs):
    """Compatibility hook for code exported from figure-building agents.

    Iris renders outside the original notebook/source host. Some imported
    scripts call apply_figure_style() as a host-provided helper, so provide a
    safe local implementation instead of failing the whole render.
    """
    try:
        import matplotlib.pyplot as _iris_plt
    except Exception:
        return fig
    try:
        _iris_fig = fig if fig is not None else _iris_plt.gcf()
        if _iris_fig is None:
            return fig
        width = kwargs.get("width") or kwargs.get("fig_width")
        height = kwargs.get("height") or kwargs.get("fig_height")
        dpi = kwargs.get("dpi")
        if width and height and hasattr(_iris_fig, "set_size_inches"):
            _iris_fig.set_size_inches(float(width), float(height))
        if dpi and hasattr(_iris_fig, "set_dpi"):
            _iris_fig.set_dpi(float(dpi))
        if kwargs.get("facecolor") and hasattr(_iris_fig, "set_facecolor"):
            _iris_fig.set_facecolor(kwargs.get("facecolor"))
        axes = [ax] if ax is not None else list(getattr(_iris_fig, "axes", []))
        for _iris_ax in axes:
            if _iris_ax is None:
                continue
            if kwargs.get("title"):
                _iris_ax.set_title(kwargs.get("title"))
            if kwargs.get("xlabel"):
                _iris_ax.set_xlabel(kwargs.get("xlabel"))
            if kwargs.get("ylabel"):
                _iris_ax.set_ylabel(kwargs.get("ylabel"))
            if "grid" in kwargs:
                _iris_ax.grid(bool(kwargs.get("grid")), alpha=kwargs.get("grid_alpha", 0.25))
        try:
            _iris_fig.tight_layout()
        except Exception:
            pass
    except Exception as _iris_exc:
        print(f"[Iris warning] apply_figure_style could not apply all options: {_iris_exc}", file=_iris_sys.stderr)
    return fig

import time as _iris_time
_IRIS_RENDER_STARTED_NS = _iris_time.time_ns()

def _iris_find_figure(scope=None):
    try:
        import matplotlib.pyplot as _plt
    except Exception:
        _plt = None
    _ns = scope if scope is not None else globals()
    for _name in ('fig', 'chart', 'figure', 'g', 'f', 'plot', 'grid'):
        _cand = _ns.get(_name)
        if _cand is not None:
            if hasattr(_cand, 'savefig') or hasattr(_cand, 'write_image') or hasattr(_cand, 'save'):
                return _cand
            if hasattr(_cand, 'fig') and (hasattr(_cand.fig, 'savefig') or hasattr(_cand.fig, 'canvas')):
                return _cand.fig
            if hasattr(_cand, 'figure') and (hasattr(_cand.figure, 'savefig') or hasattr(_cand.figure, 'canvas')):
                return _cand.figure
    for _cand in list(_ns.values()):
        if hasattr(_cand, 'savefig') and hasattr(_cand, 'set_size_inches'):
            return _cand
        if hasattr(_cand, 'fig') and hasattr(_cand.fig, 'savefig'):
            return _cand.fig
        if hasattr(_cand, 'figure') and hasattr(_cand.figure, 'savefig'):
            return _cand.figure
    if _plt is not None:
        try:
            if hasattr(_plt, 'get_fignums') and _plt.get_fignums():
                return _plt.figure(_plt.get_fignums()[-1])
            _cf = _plt.gcf()
            if _cf is not None and getattr(_cf, 'axes', None):
                return _cf
        except Exception:
            pass
    return None

"#
}

pub fn python_has_render_deps(python: &Path) -> bool {
    let probe = "import importlib.util, sys\nmods=['numpy','pandas','matplotlib','seaborn','plotly','kaleido','altair','vl_convert','scipy','statsmodels']\nmissing=[m for m in mods if importlib.util.find_spec(m) is None]\nprint('\\n'.join(missing))\nsys.exit(1 if missing else 0)";
    Command::new(python)
        .arg("-c")
        .arg(probe)
        .current_dir(std::env::temp_dir())
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Return the Python interpreter Iris should use for graph rendering.
/// Users can override with IRIS_PYTHON; otherwise Iris creates and maintains
/// a local venv with the plotting stack so packaged app renders are stable.
pub fn ensure_python_renderer() -> Result<PathBuf, String> {
    if let Ok(p) = std::env::var("IRIS_PYTHON") {
        if !p.is_empty() {
            return Ok(PathBuf::from(p));
        }
    }

    let venv = iris_venv_dir();
    let python = iris_venv_python_path(&venv);
    if !python.exists() {
        if let Some(parent) = venv.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Could not create Iris Python environment folder: {e}"))?;
        }
        let system_python = find_system_python();
        let output = Command::new(&system_python)
            .arg("-m")
            .arg("venv")
            .arg(&venv)
            .current_dir(std::env::temp_dir())
            .output()
            .map_err(|e| format!("Failed to create Iris Python environment with '{system_python}': {e}"))?;
        if !output.status.success() {
            return Err(format!(
                "Failed to create Iris Python environment with '{}': {}{}",
                system_python,
                String::from_utf8_lossy(&output.stdout),
                String::from_utf8_lossy(&output.stderr)
            ));
        }
    }

    if python_has_render_deps(&python) {
        return Ok(python);
    }

    let packages = [
        "numpy",
        "pandas",
        "matplotlib",
        "seaborn",
        "plotly",
        "kaleido",
        "altair",
        "vl-convert-python",
        "scipy",
        "statsmodels",
    ];
    let mut command = Command::new(&python);
    command
        .arg("-m")
        .arg("pip")
        .arg("install")
        .arg("--upgrade")
        .arg("pip")
        .arg("wheel")
        .arg("setuptools");
    let bootstrap = command
        .current_dir(std::env::temp_dir())
        .output()
        .map_err(|e| format!("Failed to prepare Iris Python environment: {e}"))?;
    if !bootstrap.status.success() {
        return Err(format!(
            "Failed to prepare Iris Python environment: {}{}",
            String::from_utf8_lossy(&bootstrap.stdout),
            String::from_utf8_lossy(&bootstrap.stderr)
        ));
    }

    let output = Command::new(&python)
        .arg("-m")
        .arg("pip")
        .arg("install")
        .args(packages)
        .current_dir(std::env::temp_dir())
        .output()
        .map_err(|e| format!("Failed to install Iris Python graph packages: {e}"))?;
    if !output.status.success() {
        return Err(format!(
            "Failed to install Iris Python graph packages into '{}': {}{}",
            venv.to_string_lossy(),
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    Ok(python)
}

#[tauri::command]
pub fn repair_python_env() -> RResult {
    match ensure_python_renderer() {
        Ok(p) => RResult {
            stdout: format!("Python renderer ready at {}", p.display()),
            stderr: String::new(),
            success: true,
        },
        Err(e) => RResult {
            stdout: String::new(),
            stderr: e,
            success: false,
        },
    }
}


