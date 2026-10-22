use base64::Engine;
use std::path::{Path, PathBuf};
use std::process::Command;
use crate::types::{RResult, RenderResult};
use crate::utils::unique_tmp;

pub fn find_rscript() -> String {
    if let Ok(p) = std::env::var("IRIS_RSCRIPT") {
        if !p.is_empty() {
            return p;
        }
    }
    let candidates = [
        "/usr/local/bin/Rscript",
        "/opt/homebrew/bin/Rscript",
        "/usr/bin/Rscript",
        "/Library/Frameworks/R.framework/Resources/bin/Rscript",
    ];
    for c in candidates {
        if Path::new(c).exists() {
            return c.to_string();
        }
    }
    "Rscript".to_string()
}

/// Run an arbitrary R script and capture stdout/stderr.
#[tauri::command]
pub fn run_r_script(script: String) -> RResult {
    let path = unique_tmp("R");
    if let Err(e) = std::fs::write(&path, script.as_bytes()) {
        return RResult {
            stdout: String::new(),
            stderr: format!("Failed to write temp script: {e}"),
            success: false,
        };
    }
    let output = Command::new(find_rscript())
        .arg("--vanilla")
        .arg(&path)
        // Launched-from-Finder apps inherit cwd "/", which is not writable.
        // Run from a writable temp dir so implicit-plot devices etc. succeed.
        .current_dir(std::env::temp_dir())
        .output();
    let _ = std::fs::remove_file(&path);
    match output {
        Ok(o) => RResult {
            stdout: String::from_utf8_lossy(&o.stdout).to_string(),
            stderr: String::from_utf8_lossy(&o.stderr).to_string(),
            success: o.status.success(),
        },
        Err(e) => RResult {
            stdout: String::new(),
            stderr: format!(
                "Failed to launch Rscript at '{}': {e}. Set IRIS_RSCRIPT to the correct path.",
                find_rscript()
            ),
            success: false,
        },
    }
}

/// Render ggplot2 code to an image. Prefer a plot object named `p`; otherwise use ggplot2::last_plot().
/// If `save_path` is provided the figure is written there; otherwise a base64
/// PNG/SVG is returned for in-app preview.
#[tauri::command]
pub fn render_plot(
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
    let fmt_json = serde_json::to_string(&fmt).unwrap_or_else(|_| format!("\"{}\"", fmt));

    // Generated code ends with a bare `p` for readability. The renderer opens
    // the requested graphics device first so imported base R plots and styled
    // ggplot scripts are captured exactly instead of being rebuilt via ggsave.
    let mut kept: Vec<&str> = code.lines().collect();
    while kept.last().map(|l| l.trim().is_empty()).unwrap_or(false) {
        kept.pop();
    }
    if kept.last().map(|l| l.trim()) == Some("p") {
        kept.pop();
    }
    let code = kept.join("\n");

    let full = format!(
        "options(warn = -1)\n\
         .iris_lib <- Sys.getenv(\"R_LIBS_USER\", unset = file.path(path.expand(\"~\"), \"Library\", \"R\", \"iris-libs\"))\n\
         dir.create(.iris_lib, recursive = TRUE, showWarnings = FALSE)\n\
         .libPaths(c(.iris_lib, .libPaths()))\n\
         if (!requireNamespace(\"ggplot2\", quietly = TRUE)) {{\n\
           try(utils::install.packages(\"ggplot2\", lib = .iris_lib, repos = \"https://cloud.r-project.org\", quiet = TRUE), silent = TRUE)\n\
         }}\n\
         if (!requireNamespace(\"ggplot2\", quietly = TRUE)) stop(\"R rendering needs the package 'ggplot2'. Iris tried to install it automatically but could not. Install it manually with install.packages('ggplot2').\", call. = FALSE)\n\
         suppressMessages(suppressWarnings(library(ggplot2)))\n\
         .iris_out <- {out}\n\
         .iris_fmt <- {fmt}\n\
         .iris_open_device <- function() {{\n\
           if (.iris_fmt == \"svg\") {{\n\
             if (!requireNamespace(\"svglite\", quietly = TRUE)) {{\n\
               try({{\n\
                 .iris_lib <- Sys.getenv(\"R_LIBS_USER\", unset = file.path(path.expand(\"~\"), \"Library\", \"R\", \"iris-libs\"))\n\
                 dir.create(.iris_lib, recursive = TRUE, showWarnings = FALSE)\n\
                 .libPaths(c(.iris_lib, .libPaths()))\n\
                 utils::install.packages(\"svglite\", lib = .iris_lib, repos = \"https://cloud.r-project.org\", quiet = TRUE)\n\
               }}, silent = TRUE)\n\
             }}\n\
             if (requireNamespace(\"svglite\", quietly = TRUE)) {{\n\
               svglite::svglite(file = .iris_out, width = {w}, height = {h}, bg = \"white\")\n\
             }} else {{\n\
               tryCatch(\n\
                 grDevices::svg(filename = .iris_out, width = {w}, height = {h}, bg = \"white\"),\n\
                 error = function(e) stop(\"SVG export needs the R package 'svglite' or a working XQuartz/Cairo setup. Iris tried to install svglite automatically but could not (offline?). Install it manually with install.packages('svglite'). Original error: \", conditionMessage(e), call. = FALSE)\n\
               )\n\
             }}\n\
           }} else if (.iris_fmt == \"pdf\") {{\n\
             grDevices::pdf(file = .iris_out, width = {w}, height = {h}, bg = \"white\")\n\
           }} else if (.iris_fmt %in% c(\"jpg\", \"jpeg\")) {{\n\
             grDevices::jpeg(filename = .iris_out, width = {w}, height = {h}, units = \"in\", res = {dpi}, bg = \"white\", quality = 100)\n\
           }} else {{\n\
             grDevices::png(filename = .iris_out, width = {w}, height = {h}, units = \"in\", res = {dpi}, bg = \"white\")\n\
           }}\n\
         }}\n\
         .iris_open_device()\n\
         if (grDevices::dev.cur() <= 1) stop(\"R could not open the requested graphics device for \", .iris_fmt, \" output.\", call. = FALSE)\n\
         tryCatch(grDevices::dev.control(displaylist = \"enable\"), error = function(e) NULL)\n\
         .iris_ok <- FALSE\n\
         tryCatch({{\n\
         {code}\n\
           if (exists(\"p\", inherits = TRUE)) {{\n\
             print(p); .iris_ok <- TRUE\n\
           }} else {{\n\
             .iris_last <- tryCatch(ggplot2::last_plot(), error = function(e) NULL)\n\
             if (!is.null(.iris_last)) {{ print(.iris_last); .iris_ok <- TRUE }}\n\
           }}\n\
           if (!.iris_ok) {{\n\
             .iris_dl <- tryCatch(grDevices::recordPlot(), error = function(e) NULL)\n\
             if (!is.null(.iris_dl) && length(.iris_dl[[1]]) > 0) .iris_ok <- TRUE\n\
           }}\n\
         }}, finally = {{\n\
           if (grDevices::dev.cur() > 1) grDevices::dev.off()\n\
         }})\n\
         if (!.iris_ok) stop(\"No plot was produced. Assign your ggplot to `p` or leave it as the last plot; base R plotting also works.\", call. = FALSE)\n",
        code = code,
        out = out_json,
        fmt = fmt_json,
        w = width,
        h = height,
        dpi = dpi
    );

    let script_path = unique_tmp("R");
    if let Err(e) = std::fs::write(&script_path, full.as_bytes()) {
        return RenderResult {
            success: false,
            stderr: format!("Failed to write temp script: {e}"),
            format: fmt,
            data: String::new(),
            saved_to: None,
            artists: vec![],
        };
    }
    let output = Command::new(find_rscript())
        .arg("--vanilla")
        .arg(&script_path)
        .current_dir(std::env::temp_dir())
        .output();
    let _ = std::fs::remove_file(&script_path);

    let (success, stderr) = match output {
        Ok(o) => (
            o.status.success(),
            String::from_utf8_lossy(&o.stderr).to_string(),
        ),
        Err(e) => (false, format!("Failed to launch Rscript: {e}")),
    };

    if !success || !target.exists() {
        return RenderResult {
            success: false,
            stderr: if stderr.is_empty() {
                "R produced no output figure.".to_string()
            } else {
                stderr
            },
            format: fmt,
            data: String::new(),
            saved_to: None,
            artists: vec![],
        };
    }

    if save_path.is_some() {
        return RenderResult {
            success: true,
            stderr,
            format: fmt,
            data: String::new(),
            saved_to: Some(target_str),
            artists: vec![],
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
            artists: vec![],
            }
        }
        Err(e) => RenderResult {
            success: false,
            stderr: format!("Rendered file could not be read: {e}"),
            format: fmt,
            data: String::new(),
            saved_to: None,
            artists: vec![],
        },
    }
}


#[tauri::command]
pub fn r_version() -> RResult {
    let output = Command::new(find_rscript())
        .arg("--vanilla")
        .arg("-e")
        .arg("cat(R.version.string); cat('\\n'); cat('ggplot2:', as.character(requireNamespace('ggplot2', quietly=TRUE)))")
        .current_dir(std::env::temp_dir())
        .output();
    match output {
        Ok(o) => RResult {
            stdout: String::from_utf8_lossy(&o.stdout).to_string(),
            stderr: String::from_utf8_lossy(&o.stderr).to_string(),
            success: o.status.success(),
        },
        Err(e) => RResult {
            stdout: String::new(),
            stderr: format!("Rscript not found at '{}': {e}", find_rscript()),
            success: false,
        },
    }
}

#[tauri::command]
pub fn install_r_svglite() -> RResult {
    let output = Command::new(find_rscript())
        .arg("--vanilla")
        .arg("-e")
        .arg("install.packages('svglite', repos='https://cloud.r-project.org', quiet=TRUE); cat(as.character(requireNamespace('svglite', quietly=TRUE)))")
        .current_dir(std::env::temp_dir())
        .output();
    match output {
        Ok(o) => RResult {
            stdout: String::from_utf8_lossy(&o.stdout).to_string(),
            stderr: String::from_utf8_lossy(&o.stderr).to_string(),
            success: o.status.success() && String::from_utf8_lossy(&o.stdout).contains("TRUE"),
        },
        Err(e) => RResult {
            stdout: String::new(),
            stderr: format!("Failed to launch Rscript: {e}"),
            success: false,
        },
    }
}

