use anyhow::Result;
use std::path::{Path, PathBuf};
use crate::service::ServiceDefinition;

pub const DEFAULT_SERVICE_DIR: &str = "/etc/juinit/services";

/// Load a service definition from a TOML file
pub fn load_service(path: &Path) -> Result<ServiceDefinition> {
    let contents = std::fs::read_to_string(path)?;
    let service: ServiceDefinition = toml::from_str(&contents)?;
    Ok(service)
}

/// Load all service definitions from a directory
pub fn load_all_services(dir: &Path) -> Result<Vec<ServiceDefinition>> {
    let mut services = Vec::new();

    if !dir.exists() {
        return Ok(services);
    }

    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("toml") {
            match load_service(&path) {
                Ok(service) => services.push(service),
                Err(e) => {
                    tracing::warn!("Failed to load service from {:?}: {}", path, e);
                }
            }
        }
    }

    Ok(services)
}

/// Get the default service directory
pub fn get_service_dir() -> PathBuf {
    std::env::var("JUINIT_SERVICE_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(DEFAULT_SERVICE_DIR))
}
