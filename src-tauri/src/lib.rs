// Iris — Tauri backend.
pub mod types;
pub mod utils;
pub mod file_ops;
pub mod python_env;
pub mod r_runner;
pub mod python_runner;
pub mod panel_splitter;
pub mod renderer_status;
pub mod updates;
pub mod localhost_server;

use std::sync::Arc;
pub use file_ops::{read_binary_file_base64, read_text_file, write_base64_file, write_text_file};
pub use localhost_server::{LocalhostState, DEFAULT_PORT};
pub use panel_splitter::split_python_figure_panels;
pub use python_env::repair_python_env;
pub use python_runner::{render_python_plot, run_python_script};
pub use r_runner::{install_r_svglite, r_version, render_plot, run_r_script};
pub use renderer_status::renderer_status;
pub use types::*;
pub use updates::UpdateState;
pub use utils::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let localhost_state = Arc::new(LocalhostState::default());
    let server_state = localhost_state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(UpdateState::default())
        .manage(localhost_state)
        .setup(move |_app| {
            tauri::async_runtime::spawn(async move {
                let _ = localhost_server::start_localhost_server(DEFAULT_PORT, server_state).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            r_runner::run_r_script,
            python_runner::run_python_script,
            r_runner::render_plot,
            python_runner::render_python_plot,
            panel_splitter::split_python_figure_panels,
            r_runner::r_version,
            renderer_status::renderer_status,
            python_env::repair_python_env,
            r_runner::install_r_svglite,
            file_ops::read_text_file,
            file_ops::read_binary_file_base64,
            file_ops::write_text_file,
            file_ops::write_base64_file,
            updates::iris_update_info,
            updates::iris_update_check,
            updates::iris_update_download,
            updates::iris_update_cancel,
            updates::iris_update_preferences,
            updates::iris_update_install,
            localhost_server::iris_localhost_info,
            localhost_server::iris_open_localhost
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
#[cfg(test)]
mod renderer_tests {
    use super::*;
    use std::process::Command;
    use std::time::Duration;

    fn renderer_available() -> bool {
        std::env::var_os("IRIS_PYTHON").is_some()
    }

    #[test]
    fn ignores_old_images_outside_the_current_render() {
        if !renderer_available() { return; }
        let old_image = unique_tmp("png");
        std::fs::write(&old_image, b"old image").unwrap();
        let result = render_python_plot("value = 1".into(), "png".into(), 4.0, 3.0, 96.0, None);
        let _ = std::fs::remove_file(&old_image);
        assert!(!result.success, "an unrelated old image was accepted as this render");
    }

    #[test]
    fn adopts_a_fresh_saved_image_when_the_figure_is_closed() {
        if !renderer_available() { return; }
        let code = "import matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.plot([0, 1], [0, 1])\nfig.savefig('panel.png')\nplt.close('all')\ndel fig";
        let result = render_python_plot(code.into(), "png".into(), 4.0, 3.0, 96.0, None);
        assert!(result.success, "{}", result.stderr);
        assert!(!result.data.is_empty());
    }

    #[test]
    fn split_reports_script_errors_even_after_images_are_saved() {
        if !renderer_available() { return; }
        let code = "import matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.plot([0, 1], [0, 1])\nfig.savefig('panel_1.png')\nfig.savefig('panel_2.png')\nraise RuntimeError('expected split failure')";
        let result = split_python_figure_panels(code.into(), 96.0);
        assert!(!result.success, "a failed script was reported as a successful split");
    }

    #[test]
    fn split_keeps_axis_labels_from_a_live_figure() {
        if !renderer_available() { return; }
        let code = "import matplotlib.pyplot as plt\nfig, axes = plt.subplots(1, 2)\nfor ax in axes:\n    ax.plot([0, 1], [0, 1])\n    ax.set_xlabel('Time')\n    ax.set_ylabel('Value')";
        let result = split_python_figure_panels(code.into(), 96.0);
        assert!(result.success, "{}", result.stderr);
        assert_eq!(result.panels.len(), 2);
        assert!(result.panels.iter().all(|panel| panel.x_label == "Time" && panel.y_label == "Value"));
    }

    #[test]
    fn python_render_exposes_scoped_artist_metadata() {
        if !renderer_available() { return; }
        let code = "import matplotlib.pyplot as plt\nfig, ax = plt.subplots()\nax.plot([0, 1], [0, 1], label='trend')\nax.scatter([0.25, 0.75], [0.2, 0.8], label='samples')\nax.set_title('Example')\nax.lines[0].set_visible(False)";
        let result = render_python_plot(code.into(), "png".into(), 4.0, 3.0, 96.0, None);
        assert!(result.success, "{}", result.stderr);
        let line = result.artists.iter().find(|item| item["key"] == "0:line:0").expect("hidden line must remain editable");
        assert_eq!(line["visible"], false);
        let scatter = result.artists.iter().find(|item| item["key"] == "0:collection:0").expect("scatter layer must be exposed");
        assert_eq!(scatter["points"].as_array().map(Vec::len), Some(2));
        assert!(result.artists.iter().any(|item| item["kind"] == "title" && item["label"] == "Example"));
    }
    #[test]
    fn python_render_exposes_custom_artist_properties() {
        if !renderer_available() { return; }
        let code = r#"import matplotlib.pyplot as plt
from matplotlib.artist import Artist
from matplotlib.transforms import Bbox
class CustomMark(Artist):
    def __init__(self):
        super().__init__()
        self._temperature = 2.5
    def get_temperature(self):
        return self._temperature
    def set_temperature(self, value):
        self._temperature = value
    def get_window_extent(self, renderer):
        return Bbox.from_bounds(100, 100, 40, 40)
    def draw(self, renderer):
        pass
fig, ax = plt.subplots()
ax.add_artist(CustomMark())"#;
        let result = render_python_plot(code.into(), "png".into(), 4.0, 3.0, 96.0, None);
        assert!(result.success, "{}", result.stderr);
        let artist = result.artists.iter().find(|item| item["key"] == "0:artist:0").expect("custom artist must be exposed");
        assert_eq!(artist["properties"]["temperature"], 2.5);
    }
    #[test]
    fn captures_verbose_script_output_without_blocking() {
        if !renderer_available() { return; }
        let mut command = Command::new(std::env::var("IRIS_PYTHON").unwrap());
        command.arg("-c").arg("import sys; sys.stdout.write('x' * 500000); sys.stderr.write('done')");
        let output = run_command_with_timeout(command, Duration::from_secs(10)).unwrap();
        assert!(output.status.success());
        assert_eq!(output.stdout.len(), 500000);
        assert_eq!(output.stderr, b"done");
    }
}

