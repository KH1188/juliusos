use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ServiceDefinition {
    pub service: ServiceConfig,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ServiceConfig {
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub service_type: ServiceType,
    pub exec: ExecConfig,
    #[serde(default)]
    pub dependencies: Dependencies,
    #[serde(default)]
    pub environment: HashMap<String, String>,
    #[serde(default)]
    pub restart: RestartPolicy,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ServiceType {
    Simple,
    Forking,
    Oneshot,
    Notify,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ExecConfig {
    pub start: String,
    #[serde(default)]
    pub stop: Option<String>,
    #[serde(default)]
    pub user: Option<String>,
    #[serde(default)]
    pub group: Option<String>,
    #[serde(default)]
    pub working_directory: Option<PathBuf>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct Dependencies {
    #[serde(default)]
    pub after: Vec<String>,
    #[serde(default)]
    pub requires: Vec<String>,
    #[serde(default)]
    pub wants: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RestartPolicy {
    #[serde(default = "default_restart_policy")]
    pub policy: RestartPolicyType,
    #[serde(default = "default_delay")]
    pub delay_seconds: u64,
    #[serde(default = "default_max_retries")]
    pub max_retries: u32,
}

impl Default for RestartPolicy {
    fn default() -> Self {
        Self {
            policy: RestartPolicyType::No,
            delay_seconds: 5,
            max_retries: 3,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RestartPolicyType {
    No,
    Always,
    OnFailure,
    OnAbnormal,
}

fn default_restart_policy() -> RestartPolicyType {
    RestartPolicyType::No
}

fn default_delay() -> u64 {
    5
}

fn default_max_retries() -> u32 {
    3
}

#[derive(Debug, Clone)]
pub enum ServiceState {
    Stopped,
    Starting,
    Running,
    Stopping,
    Failed,
}

#[derive(Debug, Clone)]
pub struct ServiceInstance {
    pub definition: ServiceDefinition,
    pub state: ServiceState,
    pub pid: Option<u32>,
    pub restart_count: u32,
}

impl ServiceInstance {
    pub fn new(definition: ServiceDefinition) -> Self {
        Self {
            definition,
            state: ServiceState::Stopped,
            pid: None,
            restart_count: 0,
        }
    }
}
