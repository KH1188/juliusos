use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub const SOCKET_PATH: &str = "/run/juinit/control.sock";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IpcRequest {
    StartService { name: String },
    StopService { name: String },
    RestartService { name: String },
    GetStatus { name: Option<String> },
    ListServices,
    EnableService { name: String },
    DisableService { name: String },
    ReloadDaemon,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IpcResponse {
    Success { message: String },
    Error { message: String },
    Status { services: Vec<ServiceStatus> },
    ServiceList { services: Vec<String> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceStatus {
    pub name: String,
    pub state: String,
    pub pid: Option<u32>,
    pub enabled: bool,
}

/// Get the socket path, allowing override via environment
pub fn get_socket_path() -> PathBuf {
    std::env::var("JUINIT_SOCKET")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(SOCKET_PATH))
}

/// Send a request to the daemon and wait for response
pub async fn send_request(request: IpcRequest) -> Result<IpcResponse> {
    // TODO: Implement Unix socket client
    // For now, return a placeholder
    Ok(IpcResponse::Error {
        message: "IPC not yet implemented".to_string(),
    })
}
