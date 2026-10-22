use std::process::Command;
use crate::types::RendererStatus;
use crate::r_runner::find_rscript;
use crate::python_env::{iris_venv_dir, iris_venv_python_path};

#[tauri::command]
pub fn renderer_status() -> RendererStatus {
    let rscript = find_rscript();
    let r_probe = Command::new(&rscript)
        .arg("--vanilla")
        .arg("-e")
        .arg("cat(R.version.string); cat('|'); cat(as.character(requireNamespace('ggplot2', quietly=TRUE))); cat('|'); cat(as.character(requireNamespace('svglite', quietly=TRUE)))")
        .current_dir(std::env::temp_dir())
        .output();
    let (r_version, r_ggplot2, r_svglite, r_found) = match r_probe {
        Ok(o) if o.status.success() => {
            let s = String::from_utf8_lossy(&o.stdout).to_string();
            let parts: Vec<&str> = s.split('|').collect();
            (
                parts.first().unwrap_or(&"").trim().to_string(),
                parts.get(1).map(|v| v.trim() == "TRUE").unwrap_or(false),
                parts.get(2).map(|v| v.trim() == "TRUE").unwrap_or(false),
                true,
            )
        }
        _ => (String::new(), false, false, false),
    };

    let venv = iris_venv_dir();
    let py = iris_venv_python_path(&venv);
    let python_found = py.exists();
    let (python_version, python_missing, python_ready) = if python_found {
        let probe = "import importlib.util, platform\nmods=['numpy','pandas','matplotlib','seaborn','plotly','altair','vl_convert','kaleido','scipy','statsmodels']\nmissing=[m for m in mods if importlib.util.find_spec(m) is None]\nprint(platform.python_version())\nprint(','.join(missing))";
        match Command::new(&py)
            .arg("-c")
            .arg(probe)
            .current_dir(std::env::temp_dir())
            .output()
        {
            Ok(o) => {
                let s = String::from_utf8_lossy(&o.stdout).to_string();
                let mut lines = s.lines();
                let ver = lines.next().unwrap_or("").trim().to_string();
                let miss: Vec<String> = lines
                    .next()
                    .unwrap_or("")
                    .split(',')
                    .filter(|x| !x.trim().is_empty())
                    .map(|x| x.trim().to_string())
                    .collect();
                let ready = miss.is_empty();
                (ver, miss, ready)
            }
            _ => (String::new(), Vec::new(), false),
        }
    } else {
        (String::new(), Vec::new(), false)
    };

    RendererStatus {
        r_path: rscript,
        r_found,
        r_version,
        r_ggplot2,
        r_svglite,
        python_path: py.to_string_lossy().to_string(),
        python_found,
        python_version,
        python_missing,
        python_ready,
    }
}
