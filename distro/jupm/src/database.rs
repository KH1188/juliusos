use anyhow::Result;
use serde::{Deserialize, Serialize};

/// Package database entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageEntry {
    pub name: String,
    pub version: String,
    pub architecture: String,
    pub installed: bool,
    pub files: Vec<String>,
    pub dependencies: Vec<String>,
}

/// Package database
pub struct PackageDatabase {
    // TODO: Use SQLite for persistence
}

impl PackageDatabase {
    pub fn new() -> Result<Self> {
        Ok(Self {})
    }

    pub async fn get_package(&self, name: &str) -> Result<Option<PackageEntry>> {
        // TODO: Query database
        Ok(None)
    }

    pub async fn list_installed(&self) -> Result<Vec<PackageEntry>> {
        // TODO: Query database
        Ok(vec![])
    }

    pub async fn install_package(&mut self, package: PackageEntry) -> Result<()> {
        // TODO: Insert into database
        Ok(())
    }

    pub async fn remove_package(&mut self, name: &str) -> Result<()> {
        // TODO: Remove from database
        Ok(())
    }
}
