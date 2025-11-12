use anyhow::Result;
use crate::ipc::{IpcRequest, IpcResponse, send_request};

/// Start a service
pub async fn start_service(service: &str) -> Result<()> {
    println!("Starting service: {}", service);

    let request = IpcRequest::StartService {
        name: service.to_string(),
    };

    match send_request(request).await? {
        IpcResponse::Success { message } => {
            println!("✓ {}", message);
            Ok(())
        }
        IpcResponse::Error { message } => {
            eprintln!("✗ Error: {}", message);
            Ok(())
        }
        _ => {
            eprintln!("✗ Unexpected response from daemon");
            Ok(())
        }
    }
}

/// Stop a service
pub async fn stop_service(service: &str) -> Result<()> {
    println!("Stopping service: {}", service);

    let request = IpcRequest::StopService {
        name: service.to_string(),
    };

    match send_request(request).await? {
        IpcResponse::Success { message } => {
            println!("✓ {}", message);
            Ok(())
        }
        IpcResponse::Error { message } => {
            eprintln!("✗ Error: {}", message);
            Ok(())
        }
        _ => {
            eprintln!("✗ Unexpected response from daemon");
            Ok(())
        }
    }
}

/// Restart a service
pub async fn restart_service(service: &str) -> Result<()> {
    println!("Restarting service: {}", service);

    let request = IpcRequest::RestartService {
        name: service.to_string(),
    };

    match send_request(request).await? {
        IpcResponse::Success { message } => {
            println!("✓ {}", message);
            Ok(())
        }
        IpcResponse::Error { message } => {
            eprintln!("✗ Error: {}", message);
            Ok(())
        }
        _ => {
            eprintln!("✗ Unexpected response from daemon");
            Ok(())
        }
    }
}

/// Show service status
pub async fn show_status(service: Option<&str>) -> Result<()> {
    let request = IpcRequest::GetStatus {
        name: service.map(|s| s.to_string()),
    };

    match send_request(request).await? {
        IpcResponse::Status { services } => {
            if services.is_empty() {
                println!("No services found");
                return Ok(());
            }

            println!("\n{:<20} {:<12} {:<10} {:<10}", "SERVICE", "STATE", "PID", "ENABLED");
            println!("{}", "-".repeat(55));

            for svc in services {
                let pid_str = svc.pid.map(|p| p.to_string()).unwrap_or_else(|| "-".to_string());
                let enabled_str = if svc.enabled { "enabled" } else { "disabled" };
                println!("{:<20} {:<12} {:<10} {:<10}", svc.name, svc.state, pid_str, enabled_str);
            }
            println!();
            Ok(())
        }
        IpcResponse::Error { message } => {
            eprintln!("✗ Error: {}", message);
            Ok(())
        }
        _ => {
            eprintln!("✗ Unexpected response from daemon");
            Ok(())
        }
    }
}

/// List all services
pub async fn list_services() -> Result<()> {
    let request = IpcRequest::ListServices;

    match send_request(request).await? {
        IpcResponse::ServiceList { services } => {
            println!("\nAvailable services:");
            for service in services {
                println!("  • {}", service);
            }
            println!();
            Ok(())
        }
        IpcResponse::Error { message } => {
            eprintln!("✗ Error: {}", message);
            Ok(())
        }
        _ => {
            eprintln!("✗ Unexpected response from daemon");
            Ok(())
        }
    }
}

/// Enable a service at boot
pub async fn enable_service(service: &str) -> Result<()> {
    println!("Enabling service: {}", service);

    let request = IpcRequest::EnableService {
        name: service.to_string(),
    };

    match send_request(request).await? {
        IpcResponse::Success { message } => {
            println!("✓ {}", message);
            Ok(())
        }
        IpcResponse::Error { message } => {
            eprintln!("✗ Error: {}", message);
            Ok(())
        }
        _ => {
            eprintln!("✗ Unexpected response from daemon");
            Ok(())
        }
    }
}

/// Disable a service at boot
pub async fn disable_service(service: &str) -> Result<()> {
    println!("Disabling service: {}", service);

    let request = IpcRequest::DisableService {
        name: service.to_string(),
    };

    match send_request(request).await? {
        IpcResponse::Success { message } => {
            println!("✓ {}", message);
            Ok(())
        }
        IpcResponse::Error { message } => {
            eprintln!("✗ Error: {}", message);
            Ok(())
        }
        _ => {
            eprintln!("✗ Unexpected response from daemon");
            Ok(())
        }
    }
}

/// Show service logs
pub async fn show_logs(service: &str, follow: bool) -> Result<()> {
    println!("Logs for {}{}", service, if follow { " (following)" } else { "" });

    // For now, try to read from /var/log/juinit/{service}.log
    let log_path = format!("/var/log/juinit/{}.log", service);

    println!("\n✗ Log viewing not yet implemented");
    println!("  Logs would be at: {}", log_path);

    Ok(())
}

/// Reload daemon configuration
pub async fn reload_daemon() -> Result<()> {
    println!("Reloading juinit daemon configuration");

    let request = IpcRequest::ReloadDaemon;

    match send_request(request).await? {
        IpcResponse::Success { message } => {
            println!("✓ {}", message);
            Ok(())
        }
        IpcResponse::Error { message } => {
            eprintln!("✗ Error: {}", message);
            Ok(())
        }
        _ => {
            eprintln!("✗ Unexpected response from daemon");
            Ok(())
        }
    }
}
