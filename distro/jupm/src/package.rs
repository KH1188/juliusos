use serde::{Deserialize, Serialize};

/// Package metadata (.jup format)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageMetadata {
    pub package: PackageInfo,
    #[serde(default)]
    pub dependencies: Dependencies,
    #[serde(default)]
    pub services: ServiceInfo,
    #[serde(default)]
    pub files: FileInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageInfo {
    pub name: String,
    pub version: String,
    pub architecture: String,
    pub description: String,
    #[serde(default)]
    pub homepage: Option<String>,
    pub license: String,
    pub maintainer: Maintainer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Maintainer {
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Dependencies {
    #[serde(default)]
    pub runtime: Vec<String>,
    #[serde(default)]
    pub build: Vec<String>,
    #[serde(default)]
    pub optional: Vec<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ServiceInfo {
    #[serde(default)]
    pub units: Vec<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct FileInfo {
    pub install_to: String,
    #[serde(default)]
    pub preserve_config: bool,
}
