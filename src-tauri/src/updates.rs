//! Signed GitHub updates for Iris, staged cleanly and securely.
use serde::{Deserialize, Serialize};
#[cfg(unix)]
use std::os::unix::fs::OpenOptionsExt;
use std::{
    fs,
    path::{Path, PathBuf},
    sync::{atomic::{AtomicBool, Ordering}, Mutex},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{ipc::Channel, AppHandle, Manager, State};
use tauri_plugin_updater::{Update, UpdaterExt};
use tokio::sync::{oneshot, Mutex as AsyncMutex};

pub const REPOSITORY: &str = "7drbw7mdgf-lgtm/Iris";
const MAX_PACKAGE: u64 = 1024 * 1024 * 1024;

#[derive(Default)]
struct Session {
    update: Option<Update>,
    ready: bool,
    cancel: Option<oneshot::Sender<()>>,
}

#[derive(Default)]
pub struct UpdateState {
    pub port: Mutex<Option<u16>>,
    session: AsyncMutex<Session>,
    busy: AtomicBool,
    pub installing: AtomicBool,
}

struct Operation<'a>(&'a AtomicBool);
impl<'a> Operation<'a> {
    fn begin(flag: &'a AtomicBool) -> Result<Self, String> {
        flag.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .map(|_| Self(flag))
            .map_err(|_| "An update operation is already running.".into())
    }
}
impl Drop for Operation<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase", default)]
pub struct Preferences {
    pub auto_download: bool,
    pub last_checked: u64,
}

impl Default for Preferences {
    fn default() -> Self {
        Self { auto_download: true, last_checked: 0 }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub current_version: String,
    pub available_version: Option<String>,
    pub notes: Option<String>,
    pub ready: bool,
    pub auto_download: bool,
    pub last_checked: u64,
    pub can_update: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub phase: &'static str,
    pub downloaded: u64,
    pub total: Option<u64>,
}

fn folder(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_cache_dir().map(|p| p.join("updates")).map_err(|_| "Cache unavailable".into())
}

fn preferences_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_config_dir().map(|p| p.join("update-settings.json")).map_err(|_| "Config unavailable".into())
}

fn load_preferences(app: &AppHandle) -> Preferences {
    preferences_path(app).ok().and_then(|p| fs::read(p).ok()).and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default()
}

fn private_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    use std::io::Write;
    let parent = path.parent().ok_or("Invalid cache path")?;
    fs::create_dir_all(parent).map_err(|e| format!("Directory error: {e}"))?;
    let temp = path.with_extension(format!("{}.partial", std::process::id()));
    let res = (|| {
        let mut opt = fs::OpenOptions::new();
        opt.write(true).create_new(true);
        #[cfg(unix)] opt.mode(0o600);
        let mut file = opt.open(&temp)?;
        file.write_all(bytes)?;
        file.sync_all()?;
        drop(file);
        fs::rename(&temp, path)
    })();
    if res.is_err() { let _ = fs::remove_file(&temp); }
    res.map_err(|e| format!("Save update error: {e}"))
}

fn save_preferences(app: &AppHandle, value: &Preferences) -> Result<(), String> {
    private_write(&preferences_path(app)?, &serde_json::to_vec(value).map_err(|e| e.to_string())?)
}

pub fn can_update() -> bool {
    #[cfg(target_os = "macos")]
    {
        std::env::current_exe()
            .map(|p| !p.starts_with("/Volumes") && p.ancestors().any(|p| p.extension().is_some_and(|x| x == "app")))
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "macos"))]
    { true }
}

pub fn validate_asset(version: &str, url: &tauri::Url) -> Result<(), String> {
    let parts: Vec<_> = version.split('.').collect();
    if parts.len() < 2 || parts.iter().any(|p| p.is_empty() || !p.chars().all(|b| b.is_ascii_digit() || b == '-')) {
        return Err("Unsupported release version".into());
    }
    if url.scheme() != "https" || url.host_str() != Some("github.com") || url.port().is_some() || url.query().is_some() {
        return Err("Updates must come securely from official GitHub release".into());
    }
    let expected_prefix = format!("/{REPOSITORY}/releases/download/");
    if !url.path().starts_with(&expected_prefix) {
        return Err("Update origin does not match official repository".into());
    }
    Ok(())
}

fn package_path(app: &AppHandle, update: &Update) -> Result<PathBuf, String> {
    validate_asset(&update.version, &update.download_url)?;
    Ok(folder(app)?.join(format!("Iris-{}.bin", update.version)))
}

fn cached_bytes(path: &Path) -> Result<Vec<u8>, String> {
    let size = fs::metadata(path).map_err(|_| "Update not downloaded")?.len();
    if size == 0 || size > MAX_PACKAGE {
        return Err("Cached update size invalid".into());
    }
    fs::read(path).map_err(|_| "Could not read update".into())
}

fn cleanup_cache(folder: &Path, keep: Option<&Path>) {
    if let Ok(entries) = fs::read_dir(folder) {
        for entry in entries.flatten() {
            let p = entry.path();
            if keep == Some(p.as_path()) { continue; }
            if p.is_file() && p.file_name().is_some_and(|n| n.to_string_lossy().starts_with("Iris-")) {
                let _ = fs::remove_file(p);
            }
        }
    }
}

async fn get_info(app: &AppHandle, state: &UpdateState) -> UpdateInfo {
    let prefs = load_preferences(app);
    let session = state.session.lock().await;
    UpdateInfo {
        current_version: app.package_info().version.to_string(),
        available_version: session.update.as_ref().map(|u| u.version.clone()),
        notes: session.update.as_ref().and_then(|u| u.body.clone()),
        ready: session.ready,
        auto_download: prefs.auto_download,
        last_checked: prefs.last_checked,
        can_update: can_update(),
    }
}

#[tauri::command]
pub async fn iris_update_info(app: AppHandle, state: State<'_, UpdateState>) -> Result<UpdateInfo, String> {
    Ok(get_info(&app, &state).await)
}

#[tauri::command]
pub async fn iris_update_preferences(app: AppHandle, state: State<'_, UpdateState>, auto_download: bool) -> Result<UpdateInfo, String> {
    let mut prefs = load_preferences(&app);
    prefs.auto_download = auto_download;
    save_preferences(&app, &prefs)?;
    Ok(get_info(&app, &state).await)
}

#[tauri::command]
pub async fn iris_update_check(app: AppHandle, state: State<'_, UpdateState>) -> Result<UpdateInfo, String> {
    let _operation = Operation::begin(&state.busy)?;
    let update = app.updater_builder().timeout(Duration::from_secs(20)).build()
        .map_err(|e| e.to_string())?.check().await
        .map_err(|e| match e {
            tauri_plugin_updater::Error::ReleaseNotFound => "No published release found.".to_string(),
            _ => format!("GitHub update check failed: {e}"),
        })?;

    let mut ready = false;
    if let Some(ref update) = update {
        let path = package_path(&app, update)?;
        if path.exists() {
            let file = path.clone();
            ready = tauri::async_runtime::spawn_blocking(move || cached_bytes(&file).is_ok()).await.unwrap_or(false);
            if !ready { let _ = fs::remove_file(&path); }
        }
        cleanup_cache(&folder(&app)?, Some(&path));
    } else {
        cleanup_cache(&folder(&app)?, None);
    }

    {
        let mut session = state.session.lock().await;
        session.update = update;
        session.ready = ready;
    }

    let mut prefs = load_preferences(&app);
    prefs.last_checked = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    save_preferences(&app, &prefs)?;
    Ok(get_info(&app, &state).await)
}

#[tauri::command]
pub async fn iris_update_download(app: AppHandle, state: State<'_, UpdateState>, on_event: Channel<Progress>) -> Result<UpdateInfo, String> {
    let _operation = Operation::begin(&state.busy)?;
    let (sender, receiver) = oneshot::channel();
    let mut update = {
        let mut session = state.session.lock().await;
        let u = session.update.clone().ok_or("Check for updates first.")?;
        session.cancel = Some(sender);
        u
    };
    let path = package_path(&app, &update)?;
    update.timeout = Some(Duration::from_secs(30 * 60));
    let mut downloaded = 0u64;
    let mut last = Instant::now() - Duration::from_secs(1);
    let (limit_sender, limit_receiver) = oneshot::channel();
    let mut limit_sender = Some(limit_sender);

    let _ = on_event.send(Progress { phase: "downloading", downloaded: 0, total: None });

    let result = tokio::select! {
        _ = receiver => Err("Update download cancelled.".to_string()),
        _ = limit_receiver => Err("The update exceeds supported size limit.".to_string()),
        res = update.download(|chunk, total| {
            downloaded += chunk as u64;
            if (downloaded > MAX_PACKAGE || total.is_some_and(|n| n > MAX_PACKAGE)) && limit_sender.is_some() {
                if let Some(s) = limit_sender.take() { let _ = s.send(()); }
            }
            if last.elapsed() >= Duration::from_millis(100) {
                let _ = on_event.send(Progress { phase: "downloading", downloaded, total });
                last = Instant::now();
            }
        }, || {
            let _ = on_event.send(Progress { phase: "verifying", downloaded: 0, total: None });
        }) => res.map_err(|e| format!("Download error: {e}")),
    };

    state.session.lock().await.cancel = None;
    let bytes = result?;
    tauri::async_runtime::spawn_blocking(move || private_write(&path, &bytes)).await.map_err(|e| e.to_string())??;
    state.session.lock().await.ready = true;
    Ok(get_info(&app, &state).await)
}

#[tauri::command]
pub async fn iris_update_cancel(state: State<'_, UpdateState>) -> Result<(), String> {
    if let Some(cancel) = state.session.lock().await.cancel.take() {
        let _ = cancel.send(());
    }
    Ok(())
}

#[tauri::command]
pub async fn iris_update_install(app: AppHandle, state: State<'_, UpdateState>) -> Result<(), String> {
    let _operation = Operation::begin(&state.busy)?;
    let update = {
        let session = state.session.lock().await;
        if !session.ready { return Err("Download update before restarting.".into()); }
        session.update.clone().ok_or("Check for updates first.")?
    };
    let path = package_path(&app, &update)?;
    let handle = app.clone();
    state.installing.store(true, Ordering::SeqCst);
    let result = tauri::async_runtime::spawn_blocking(move || {
        let bytes = cached_bytes(&path)?;
        match update.install(bytes) {
            Ok(()) => {
                let _ = fs::remove_file(&path);
                handle.restart();
            }
            Err(e) => Err(format!("Could not install update: {e}")),
        }
    }).await.map_err(|e| e.to_string());
    state.installing.store(false, Ordering::SeqCst);
    result?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn assets_require_official_github_release() {
        let valid = format!("https://github.com/{REPOSITORY}/releases/download/v5.2.0/Iris-5.2.0-macOS-arm64.app.tar.gz");
        assert!(validate_asset("5.2.0", &valid.parse().unwrap()).is_ok());

        for invalid in [
            valid.replace("https:", "http:"),
            valid.replace("github.com/", "github.com.evil.test/"),
            valid.replace(REPOSITORY, "other/repo"),
            format!("{valid}?token=bad"),
        ] {
            assert!(validate_asset("5.2.0", &invalid.parse().unwrap()).is_err());
        }
    }

    #[test]
    fn operations_serialize_and_recover_after_failure() {
        let busy = AtomicBool::new(false);
        {
            let _first = Operation::begin(&busy).unwrap();
            assert!(Operation::begin(&busy).is_err());
        }
        assert!(Operation::begin(&busy).is_ok());
    }
}
