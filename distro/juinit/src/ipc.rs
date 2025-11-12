use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{UnixListener, UnixStream};

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
        .unwrap_or_else(|_| {
            // If /run doesn't exist, use /tmp for development
            if Path::new("/run").exists() {
                PathBuf::from(SOCKET_PATH)
            } else {
                PathBuf::from("/tmp/juinit.sock")
            }
        })
}

/// Send a request to the daemon and wait for response
pub async fn send_request(request: IpcRequest) -> Result<IpcResponse> {
    let socket_path = get_socket_path();

    // Connect to the Unix socket
    let mut stream = UnixStream::connect(&socket_path)
        .await
        .context(format!("Failed to connect to juinit daemon at {:?}. Is the daemon running?", socket_path))?;

    // Serialize and send the request
    let request_json = serde_json::to_vec(&request)?;
    let request_len = (request_json.len() as u32).to_be_bytes();

    stream.write_all(&request_len).await?;
    stream.write_all(&request_json).await?;

    // Read the response length
    let mut len_buf = [0u8; 4];
    stream.read_exact(&mut len_buf).await?;
    let response_len = u32::from_be_bytes(len_buf) as usize;

    // Read the response
    let mut response_buf = vec![0u8; response_len];
    stream.read_exact(&mut response_buf).await?;

    // Deserialize the response
    let response: IpcResponse = serde_json::from_slice(&response_buf)?;

    Ok(response)
}

/// Start the IPC server (daemon side)
pub async fn start_ipc_server(handler: impl Fn(IpcRequest) -> IpcResponse + Send + Sync + 'static) -> Result<()> {
    let socket_path = get_socket_path();

    // Remove old socket if it exists
    if socket_path.exists() {
        std::fs::remove_file(&socket_path)?;
    }

    // Create parent directory if needed
    if let Some(parent) = socket_path.parent() {
        std::fs::create_dir_all(parent).ok();
    }

    let listener = UnixListener::bind(&socket_path)
        .context(format!("Failed to bind Unix socket at {:?}", socket_path))?;

    tracing::info!("IPC server listening on {:?}", socket_path);

    let handler = std::sync::Arc::new(handler);

    loop {
        match listener.accept().await {
            Ok((mut stream, _addr)) => {
                let handler = handler.clone();

                tokio::spawn(async move {
                    if let Err(e) = handle_connection(&mut stream, handler).await {
                        tracing::error!("Error handling IPC connection: {}", e);
                    }
                });
            }
            Err(e) => {
                tracing::error!("Error accepting IPC connection: {}", e);
            }
        }
    }
}

async fn handle_connection(
    stream: &mut UnixStream,
    handler: std::sync::Arc<impl Fn(IpcRequest) -> IpcResponse + Send + Sync>,
) -> Result<()> {
    // Read request length
    let mut len_buf = [0u8; 4];
    stream.read_exact(&mut len_buf).await?;
    let request_len = u32::from_be_bytes(len_buf) as usize;

    // Read request
    let mut request_buf = vec![0u8; request_len];
    stream.read_exact(&mut request_buf).await?;

    // Deserialize request
    let request: IpcRequest = serde_json::from_slice(&request_buf)?;

    // Handle request
    let response = handler(request);

    // Serialize response
    let response_json = serde_json::to_vec(&response)?;
    let response_len = (response_json.len() as u32).to_be_bytes();

    // Send response
    stream.write_all(&response_len).await?;
    stream.write_all(&response_json).await?;

    Ok(())
}
