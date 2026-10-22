use std::path::{Path, PathBuf};
use base64::Engine;
use crate::types::FileResult;

fn validate_access_path(raw_path: &str, for_write: bool) -> Result<PathBuf, String> {
    let path = Path::new(raw_path);
    let resolved = if path.is_relative() {
        std::env::current_dir().unwrap_or_else(|_| std::env::temp_dir()).join(path)
    } else {
        path.to_path_buf()
    };
    let norm = resolved.to_string_lossy().replace('\\', "/");
    let lower = norm.to_lowercase();

    if lower.contains("/.ssh") || lower.contains("/.aws") || lower.contains("/.gnupg") ||
       lower.contains("/etc/") || lower.starts_with("/etc") || lower.contains("/private/etc") ||
       lower.contains("/.bash_history") || lower.contains("/.zsh_history") {
        return Err("Access denied: accessing sensitive system files or credentials is prohibited.".to_string());
    }
    if for_write && (lower.starts_with("/system") || lower.starts_with("/bin") || lower.starts_with("/sbin") || lower.starts_with("/usr")) {
        return Err("Access denied: writing to system directories is prohibited.".to_string());
    }
    Ok(resolved)
}

#[tauri::command]
pub fn read_text_file(path: String) -> FileResult {
    let resolved = match validate_access_path(&path, false) {
        Ok(p) => p,
        Err(e) => return FileResult { success: false, error: e, data: String::new() },
    };
    match std::fs::read_to_string(&resolved) {
        Ok(data) => FileResult {
            success: true,
            error: String::new(),
            data,
        },
        Err(e) => FileResult {
            success: false,
            error: format!("Failed to read file: {e}"),
            data: String::new(),
        },
    }
}

#[tauri::command]
pub fn read_binary_file_base64(path: String) -> FileResult {
    let resolved = match validate_access_path(&path, false) {
        Ok(p) => p,
        Err(e) => return FileResult { success: false, error: e, data: String::new() },
    };
    match std::fs::read(&resolved) {
        Ok(bytes) => FileResult {
            success: true,
            error: String::new(),
            data: base64::engine::general_purpose::STANDARD.encode(&bytes),
        },
        Err(e) => FileResult {
            success: false,
            error: format!("Failed to read file: {e}"),
            data: String::new(),
        },
    }
}

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> FileResult {
    let resolved = match validate_access_path(&path, true) {
        Ok(p) => p,
        Err(e) => return FileResult { success: false, error: e, data: String::new() },
    };
    match std::fs::write(&resolved, contents.as_bytes()) {
        Ok(_) => FileResult {
            success: true,
            error: String::new(),
            data: String::new(),
        },
        Err(e) => FileResult {
            success: false,
            error: format!("Failed to write file: {e}"),
            data: String::new(),
        },
    }
}

#[tauri::command]
pub fn write_base64_file(path: String, data: String) -> FileResult {
    let resolved = match validate_access_path(&path, true) {
        Ok(p) => p,
        Err(e) => return FileResult { success: false, error: e, data: String::new() },
    };
    match base64::engine::general_purpose::STANDARD.decode(data.as_bytes()) {
        Ok(bytes) => match std::fs::write(&resolved, bytes) {
            Ok(_) => FileResult {
                success: true,
                error: String::new(),
                data: String::new(),
            },
            Err(e) => FileResult {
                success: false,
                error: format!("Failed to write file: {e}"),
                data: String::new(),
            },
        },
        Err(e) => FileResult {
            success: false,
            error: format!("Invalid base64 data: {e}"),
            data: String::new(),
        },
    }
}

