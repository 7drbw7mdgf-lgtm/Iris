use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

pub fn unique_tmp(ext: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    std::env::temp_dir().join(format!("iris_{}.{}", nanos, ext))
}

pub struct RenderWorkDir(PathBuf);

impl RenderWorkDir {
    pub fn new() -> Result<Self, String> {
        let path = unique_tmp("work");
        std::fs::create_dir(&path).map_err(|e| format!("Could not create render working directory: {e}"))?;
        Ok(Self(path))
    }

    pub fn path(&self) -> &Path { &self.0 }
}

impl Drop for RenderWorkDir {
    fn drop(&mut self) { let _ = std::fs::remove_dir_all(&self.0); }
}
pub fn run_command_with_timeout(mut command: Command, timeout: Duration) -> Result<std::process::Output, String> {
    let capture = RenderWorkDir::new()?;
    let stdout_path = capture.path().join("stdout");
    let stderr_path = capture.path().join("stderr");
    let stdout_file = std::fs::File::create(&stdout_path)
        .map_err(|e| format!("Could not open renderer stdout: {e}"))?;
    let stderr_file = std::fs::File::create(&stderr_path)
        .map_err(|e| format!("Could not open renderer stderr: {e}"))?;
    let mut child = command
        .stdout(Stdio::from(stdout_file))
        .stderr(Stdio::from(stderr_file))
        .spawn()
        .map_err(|e| format!("Failed to launch process: {e}"))?;
    let start = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                return Ok(std::process::Output {
                    status,
                    stdout: std::fs::read(&stdout_path)
                        .map_err(|e| format!("Failed to read renderer stdout: {e}"))?,
                    stderr: std::fs::read(&stderr_path)
                        .map_err(|e| format!("Failed to read renderer stderr: {e}"))?,
                });
            }
            Ok(None) if start.elapsed() >= timeout => {
                let _ = child.kill();
                let _ = child.wait();
                let stderr = std::fs::read_to_string(&stderr_path).unwrap_or_default();
                return Err(if stderr.trim().is_empty() {
                    format!("Python render timed out after {} seconds. Check for long loops, blocking input(), plt.show(), downloads, or very large plots.", timeout.as_secs())
                } else {
                    format!("Python render timed out after {} seconds.\n{}", timeout.as_secs(), stderr)
                });
            }
            Ok(None) => thread::sleep(Duration::from_millis(100)),
            Err(e) => return Err(format!("Failed while waiting for process: {e}")),
        }
    }
}

