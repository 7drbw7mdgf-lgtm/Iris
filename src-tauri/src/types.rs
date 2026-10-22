use serde::Serialize;
use serde_json::Value;

#[derive(Serialize, Clone, Debug)]
pub struct RResult {
    pub stdout: String,
    pub stderr: String,
    pub success: bool,
}

#[derive(Serialize, Clone, Debug)]
pub struct RenderResult {
    pub data: String,
    pub format: String,
    pub stderr: String,
    pub success: bool,
    pub saved_to: Option<String>,
    pub artists: Vec<Value>,
}

#[derive(Serialize, Clone, Debug)]
pub struct SplitPanelResult {
    pub title: String,
    pub graph_title: String,
    pub axis_index: usize,
    pub x_label: String,
    pub y_label: String,
    pub data: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct SplitPanelsResult {
    pub success: bool,
    pub stderr: String,
    pub panels: Vec<SplitPanelResult>,
}

#[derive(Serialize, Clone, Debug)]
pub struct FileResult {
    pub success: bool,
    pub data: String,
    pub error: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct RendererStatus {
    pub r_path: String,
    pub r_found: bool,
    pub r_version: String,
    pub r_ggplot2: bool,
    pub r_svglite: bool,
    pub python_path: String,
    pub python_found: bool,
    pub python_version: String,
    pub python_missing: Vec<String>,
    pub python_ready: bool,
}

