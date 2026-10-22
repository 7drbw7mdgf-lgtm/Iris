//! Embedded local host HTTP server for Iris.
//! Serves the web studio interface and provides REST APIs on 127.0.0.1.
use serde::{Deserialize, Serialize};
use std::{
    path::{Path, PathBuf},
    sync::{atomic::{AtomicBool, AtomicU16, Ordering}, Arc},
};
use tauri::{AppHandle, State};
use tauri_plugin_opener::OpenerExt;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream},
    sync::Mutex,
};

pub const DEFAULT_PORT: u16 = 4180;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LocalhostInfo {
    pub running: bool,
    pub port: u16,
    pub url: String,
    pub address: String,
}

#[derive(Default)]
pub struct LocalhostState {
    pub port: AtomicU16,
    pub running: AtomicBool,
    pub dist_dir: Mutex<Option<PathBuf>>,
}

fn mime_for_path(path: &Path) -> &'static str {
    match path.extension().and_then(|s| s.to_str()).unwrap_or("") {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "application/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "ico" => "image/x-icon",
        "txt" => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    }
}

fn resolve_dist_path() -> PathBuf {
    let candidates = [
        PathBuf::from("dist"),
        PathBuf::from("../dist"),
        std::env::current_exe().ok().and_then(|p| p.parent().map(|p| p.join("dist"))).unwrap_or_default(),
        std::env::current_exe().ok().and_then(|p| p.parent().map(|p| p.join("../Resources/dist"))).unwrap_or_default(),
    ];
    for c in &candidates {
        if c.exists() && c.is_dir() {
            return c.clone();
        }
    }
    PathBuf::from("dist")
}

async fn handle_connection(mut socket: TcpStream, dist_dir: PathBuf) {
    let mut buf = [0u8; 8192];
    let n = match socket.read(&mut buf).await {
        Ok(n) if n > 0 => n,
        _ => return,
    };

    let req_str = String::from_utf8_lossy(&buf[..n]);
    let mut lines = req_str.lines();
    let first_line = match lines.next() {
        Some(l) => l,
        None => return,
    };

    let parts: Vec<&str> = first_line.split_whitespace().collect();
    if parts.len() < 2 {
        return;
    }
    let method = parts[0];
    let raw_path = parts[1];
    let path = raw_path.split('?').next().unwrap_or("/");

    let cors_headers = "Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n";

    if method == "OPTIONS" {
        let resp = format!("HTTP/1.1 204 No Content\r\n{}Content-Length: 0\r\n\r\n", cors_headers);
        let _ = socket.write_all(resp.as_bytes()).await;
        return;
    }

    if path == "/api/status" || path == "/api/health" {
        let status_json = serde_json::json!({
            "status": "ok",
            "app": "Iris",
            "version": "5.2.0",
            "localhost": true,
            "dual_engines": ["r", "python"]
        });
        let body = status_json.to_string();
        let resp = format!(
            "HTTP/1.1 200 OK\r\n{}Content-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
            cors_headers, body.len(), body
        );
        let _ = socket.write_all(resp.as_bytes()).await;
        return;
    }

    // Static asset serving from dist
    let mut file_path = dist_dir.join(if path == "/" { "index.html" } else { path.trim_start_matches('/') });
    if !file_path.exists() {
        file_path = dist_dir.join("index.html");
    }

    if file_path.exists() && file_path.is_file() {
        if let Ok(content) = tokio::fs::read(&file_path).await {
            let mime = mime_for_path(&file_path);
            let header = format!(
                "HTTP/1.1 200 OK\r\n{}Content-Type: {}\r\nContent-Length: {}\r\nCache-Control: no-cache\r\n\r\n",
                cors_headers, mime, content.len()
            );
            let _ = socket.write_all(header.as_bytes()).await;
            let _ = socket.write_all(&content).await;
            return;
        }
    }

    // Default embedded fallback page if dist is not compiled
    let fallback_html = r#"<!DOCTYPE html><html><head><meta charset="utf-8"><title>Iris Local Host</title><style>body{font-family:system-ui,-apple-system,sans-serif;padding:48px 24px;text-align:center;background:#0f172a;color:#f8fafc}h1{font-size:28px;margin-bottom:8px}.card{background:#1e293b;border-radius:12px;padding:32px;max-width:540px;margin:24px auto;border:1px solid #334155;text-align:left}pre{background:#0b1120;padding:12px;border-radius:6px;overflow-x:auto;color:#38bdf8}</style></head><body><h1>❀ Iris Local Host Server</h1><p>Embedded local server is running on <code>127.0.0.1</code>.</p><div class="card"><p><strong>Status:</strong> Online and listening for API requests.</p><p>To view the full user interface, build the frontend:</p><pre>npm run build</pre><p>All Python and R code generation endpoints are available.</p></div></body></html>"#;
    let resp = format!(
        "HTTP/1.1 200 OK\r\n{}Content-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}",
        cors_headers, fallback_html.len(), fallback_html
    );
    let _ = socket.write_all(resp.as_bytes()).await;
}

pub async fn start_localhost_server(preferred_port: u16, state: Arc<LocalhostState>) -> Result<u16, String> {
    let mut bound_listener = None;
    let mut active_port = preferred_port;

    for port in [preferred_port, 4181, 4182, 4183, 8080, 0] {
        let addr = format!("127.0.0.1:{port}");
        if let Ok(listener) = TcpListener::bind(&addr).await {
            if let Ok(local_addr) = listener.local_addr() {
                active_port = local_addr.port();
                bound_listener = Some(listener);
                break;
            }
        }
    }

    let listener = bound_listener.ok_or("Could not bind local host server to any local port.")?;
    let dist_dir = resolve_dist_path();
    *state.dist_dir.lock().await = Some(dist_dir.clone());
    state.port.store(active_port, Ordering::SeqCst);
    state.running.store(true, Ordering::SeqCst);

    tokio::spawn(async move {
        loop {
            match listener.accept().await {
                Ok((socket, _)) => {
                    let d = dist_dir.clone();
                    tokio::spawn(async move {
                        handle_connection(socket, d).await;
                    });
                }
                Err(_) => break,
            }
        }
    });

    Ok(active_port)
}

#[tauri::command]
pub async fn iris_localhost_info(state: State<'_, Arc<LocalhostState>>) -> Result<LocalhostInfo, String> {
    let port = state.port.load(Ordering::SeqCst);
    let running = state.running.load(Ordering::SeqCst);
    let effective_port = if port > 0 { port } else { DEFAULT_PORT };
    Ok(LocalhostInfo {
        running,
        port: effective_port,
        url: format!("http://127.0.0.1:{effective_port}"),
        address: format!("127.0.0.1:{effective_port}"),
    })
}

#[tauri::command]
pub async fn iris_open_localhost(
    app: AppHandle,
    state: State<'_, Arc<LocalhostState>>,
) -> Result<String, String> {
    let port = state.port.load(Ordering::SeqCst);
    let effective_port = if port > 0 { port } else { DEFAULT_PORT };
    let url = format!("http://127.0.0.1:{effective_port}");
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("Could not open browser: {e}"))?;
    Ok(url)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mime_resolution_handles_common_web_types() {
        assert_eq!(mime_for_path(Path::new("index.html")), "text/html; charset=utf-8");
        assert_eq!(mime_for_path(Path::new("bundle.js")), "application/javascript; charset=utf-8");
        assert_eq!(mime_for_path(Path::new("style.css")), "text/css; charset=utf-8");
        assert_eq!(mime_for_path(Path::new("icon.svg")), "image/svg+xml");
        assert_eq!(mime_for_path(Path::new("data.json")), "application/json");
    }

    #[tokio::test]
    async fn localhost_state_reflects_bound_port() {
        let state = Arc::new(LocalhostState::default());
        let port = start_localhost_server(0, state.clone()).await.unwrap();
        assert!(port > 0);
        assert_eq!(state.port.load(Ordering::SeqCst), port);
        assert_eq!(state.running.load(Ordering::SeqCst), true);
    }
}
