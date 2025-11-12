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

        // TODO: Mount /proc, /sys, /dev, /run
        // This requires root privileges and should only run as PID 1
        // For now, we'll skip this in development mode

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
}

/// Run the init daemon as PID 1
pub async fn run() -> Result<()> {
    info!("juinit daemon starting...");

    let daemon = Daemon::new();

    // Step 1: Mount essential filesystems (if PID 1)
    if std::process::id() == 1 {
        Daemon::mount_essential_filesystems()?;
    } else {
        warn!("Not running as PID 1, skipping filesystem mounts");
    }

    // Step 2: Load service definitions
    daemon.load_services().await?;

    // Step 3: Start default services
    // TODO: Implement target system and start default.target

    // Step 4: Set up signal handlers
    // TODO: Handle SIGCHLD for process reaping, SIGTERM for shutdown

    info!("System initialization complete");

    // Step 5: Main event loop
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        daemon.monitor_services().await;
    }
}
