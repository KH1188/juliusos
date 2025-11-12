use anyhow::{Result, Context};
use nix::sys::signal::{self, Signal};
use nix::unistd::Pid;
use std::collections::HashMap;
use std::process::Command;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error, warn};

use crate::config::{get_service_dir, load_all_services};
use crate::service::{ServiceInstance, ServiceState, ServiceDefinition};
use crate::ipc::{start_ipc_server, IpcRequest, IpcResponse, ServiceStatus};

pub struct Daemon {
    services: Arc<RwLock<HashMap<String, ServiceInstance>>>,
}

impl Daemon {
    pub fn new() -> Self {
        Self {
            services: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Load all service definitions
    async fn load_services(&self) -> Result<()> {
        let service_dir = get_service_dir();
        info!("Loading services from {:?}", service_dir);

        let definitions = load_all_services(&service_dir)?;
        let mut services = self.services.write().await;

        for def in definitions {
            let name = def.service.name.clone();
            info!("Loaded service: {}", name);
            services.insert(name, ServiceInstance::new(def));
        }

        Ok(())
    }

    /// Mount essential filesystems (only if running as PID 1)
    fn mount_essential_filesystems() -> Result<()> {
        info!("Mounting essential filesystems...");

        use std::process::Command;
        use std::path::Path;

        // Essential filesystem mounts for an init system
        let mounts = vec![
            ("/proc", "proc", "proc", "nosuid,noexec,nodev"),
            ("/sys", "sysfs", "sysfs", "nosuid,noexec,nodev"),
            ("/dev", "devtmpfs", "devtmpfs", "mode=0755,nosuid"),
            ("/dev/pts", "devpts", "devpts", "mode=0620,gid=5,nosuid,noexec"),
            ("/dev/shm", "tmpfs", "tmpfs", "mode=1777,nosuid,nodev"),
            ("/run", "tmpfs", "tmpfs", "mode=0755,nosuid,nodev"),
            ("/tmp", "tmpfs", "tmpfs", "mode=1777,nosuid,nodev"),
        ];

        for (mountpoint, fstype, source, options) in mounts {
            // Check if already mounted
            if Path::new(mountpoint).exists() {
                // Create mountpoint if it doesn't exist
                if !Path::new(mountpoint).is_dir() {
                    std::fs::create_dir_all(mountpoint)
                        .context(format!("Failed to create mountpoint {}", mountpoint))?;
                }

                // Try to mount (this will fail if not running as root/PID 1)
                let output = Command::new("mount")
                    .args(&["-t", fstype, "-o", options, source, mountpoint])
                    .output();

                match output {
                    Ok(out) if out.status.success() => {
                        info!("Mounted {} at {}", source, mountpoint);
                    }
                    Ok(out) => {
                        let stderr = String::from_utf8_lossy(&out.stderr);
                        // Ignore "already mounted" errors
                        if !stderr.contains("already mounted") {
                            warn!("Failed to mount {}: {}", mountpoint, stderr);
                        }
                    }
                    Err(e) => {
                        warn!("Failed to execute mount for {}: {}", mountpoint, e);
                    }
                }
            }
        }

        Ok(())
    }

    /// Start a service by name
    pub async fn start_service(&self, name: &str) -> Result<()> {
        let mut services = self.services.write().await;
        let service = services.get_mut(name)
            .context(format!("Service '{}' not found", name))?;

        match service.state {
            ServiceState::Running => {
                info!("Service {} is already running", name);
                return Ok(());
            }
            ServiceState::Starting => {
                info!("Service {} is already starting", name);
                return Ok(());
            }
            _ => {}
        }

        info!("Starting service: {}", name);
        service.state = ServiceState::Starting;

        // Parse the start command
        let start_cmd = &service.definition.service.exec.start;
        let parts: Vec<&str> = start_cmd.split_whitespace().collect();

        if parts.is_empty() {
            error!("Empty start command for service {}", name);
            service.state = ServiceState::Failed;
            return Ok(());
        }

        // Spawn the process
        let mut cmd = Command::new(parts[0]);
        if parts.len() > 1 {
            cmd.args(&parts[1..]);
        }

        // Set working directory if specified
        if let Some(ref wd) = service.definition.service.exec.working_directory {
            cmd.current_dir(wd);
        }

        // Set environment variables
        for (key, value) in &service.definition.service.environment {
            cmd.env(key, value);
        }

        match cmd.spawn() {
            Ok(child) => {
                let pid = child.id();
                service.pid = Some(pid);
                service.state = ServiceState::Running;
                info!("Service {} started with PID {}", name, pid);
            }
            Err(e) => {
                error!("Failed to start service {}: {}", name, e);
                service.state = ServiceState::Failed;
            }
        }

        Ok(())
    }

    /// Stop a service by name
    pub async fn stop_service(&self, name: &str) -> Result<()> {
        let mut services = self.services.write().await;
        let service = services.get_mut(name)
            .context(format!("Service '{}' not found", name))?;

        match service.state {
            ServiceState::Stopped => {
                info!("Service {} is already stopped", name);
                return Ok(());
            }
            ServiceState::Stopping => {
                info!("Service {} is already stopping", name);
                return Ok(());
            }
            _ => {}
        }

        if let Some(pid) = service.pid {
            info!("Stopping service {} (PID {})", name, pid);
            service.state = ServiceState::Stopping;

            // Send SIGTERM to the process
            match signal::kill(Pid::from_raw(pid as i32), Signal::SIGTERM) {
                Ok(_) => {
                    info!("Sent SIGTERM to service {} (PID {})", name, pid);
                    // TODO: Wait for process to exit, then mark as stopped
                    service.state = ServiceState::Stopped;
                    service.pid = None;
                }
                Err(e) => {
                    error!("Failed to send SIGTERM to service {}: {}", name, e);
                    service.state = ServiceState::Failed;
                }
            }
        }

        Ok(())
    }

    /// Monitor services and restart if needed
    async fn monitor_services(&self) {
        // TODO: Check for dead processes and restart according to policy
        let services = self.services.read().await;

        for (name, service) in services.iter() {
            if let Some(pid) = service.pid {
                // Check if process is still running
                match signal::kill(Pid::from_raw(pid as i32), None) {
                    Ok(_) => {
                        // Process is running
                    }
                    Err(_) => {
                        // Process is dead
                        warn!("Service {} (PID {}) has died", name, pid);
                        // TODO: Implement restart logic based on restart policy
                    }
                }
            }
        }
    }

    /// Get status of all services or a specific service
    pub async fn get_status(&self, name: Option<&str>) -> Vec<ServiceStatus> {
        let services = self.services.read().await;

        if let Some(n) = name {
            // Single service
            if let Some(svc) = services.get(n) {
                vec![ServiceStatus {
                    name: n.to_string(),
                    state: format!("{:?}", svc.state),
                    pid: svc.pid,
                    enabled: false, // TODO: Check if enabled
                }]
            } else {
                vec![]
            }
        } else {
            // All services
            services
                .iter()
                .map(|(name, svc)| ServiceStatus {
                    name: name.clone(),
                    state: format!("{:?}", svc.state),
                    pid: svc.pid,
                    enabled: false, // TODO: Check if enabled
                })
                .collect()
        }
    }

    /// List all service names
    pub async fn list_services(&self) -> Vec<String> {
        let services = self.services.read().await;
        services.keys().cloned().collect()
    }

    /// Handle an IPC request
    pub async fn handle_ipc_request(&self, request: IpcRequest) -> IpcResponse {
        match request {
            IpcRequest::StartService { name } => {
                match self.start_service(&name).await {
                    Ok(_) => IpcResponse::Success {
                        message: format!("Service '{}' started", name),
                    },
                    Err(e) => IpcResponse::Error {
                        message: format!("Failed to start service '{}': {}", name, e),
                    },
                }
            }
            IpcRequest::StopService { name } => {
                match self.stop_service(&name).await {
                    Ok(_) => IpcResponse::Success {
                        message: format!("Service '{}' stopped", name),
                    },
                    Err(e) => IpcResponse::Error {
                        message: format!("Failed to stop service '{}': {}", name, e),
                    },
                }
            }
            IpcRequest::RestartService { name } => {
                let _ = self.stop_service(&name).await;
                match self.start_service(&name).await {
                    Ok(_) => IpcResponse::Success {
                        message: format!("Service '{}' restarted", name),
                    },
                    Err(e) => IpcResponse::Error {
                        message: format!("Failed to restart service '{}': {}", name, e),
                    },
                }
            }
            IpcRequest::GetStatus { name } => {
                let services = self.get_status(name.as_deref()).await;
                IpcResponse::Status { services }
            }
            IpcRequest::ListServices => {
                let services = self.list_services().await;
                IpcResponse::ServiceList { services }
            }
            IpcRequest::EnableService { name } => {
                // TODO: Implement enable/disable
                IpcResponse::Error {
                    message: "Enable/disable not yet implemented".to_string(),
                }
            }
            IpcRequest::DisableService { name } => {
                // TODO: Implement enable/disable
                IpcResponse::Error {
                    message: "Enable/disable not yet implemented".to_string(),
                }
            }
            IpcRequest::ReloadDaemon => {
                // TODO: Reload service definitions
                IpcResponse::Success {
                    message: "Configuration reloaded".to_string(),
                }
            }
        }
    }
}

/// Run the init daemon as PID 1
pub async fn run() -> Result<()> {
    info!("juinit daemon starting...");

    let daemon = Arc::new(Daemon::new());

    // Step 1: Mount essential filesystems (if PID 1)
    if std::process::id() == 1 {
        Daemon::mount_essential_filesystems()?;
    } else {
        warn!("Not running as PID 1, skipping filesystem mounts");
    }

    // Step 2: Load service definitions
    daemon.load_services().await?;

    // Step 3: Start IPC server
    let daemon_for_ipc = daemon.clone();
    tokio::spawn(async move {
        if let Err(e) = start_ipc_server(move |request| {
            // We need to block on the async handler
            let daemon = daemon_for_ipc.clone();
            tokio::runtime::Handle::current().block_on(async {
                daemon.handle_ipc_request(request).await
            })
        }).await {
            error!("IPC server error: {}", e);
        }
    });

    // Step 4: Start default services
    // TODO: Implement target system and start default.target

    // Step 5: Set up signal handlers
    // TODO: Handle SIGCHLD for process reaping, SIGTERM for shutdown

    info!("System initialization complete");

    // Step 6: Main event loop
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        daemon.monitor_services().await;
    }
}
