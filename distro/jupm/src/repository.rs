use anyhow::Result;

/// Package repository
pub struct Repository {
    pub name: String,
    pub url: String,
}

impl Repository {
    pub fn new(name: String, url: String) -> Self {
        Self { name, url }
    }

    /// Fetch package index from repository
    pub async fn fetch_index(&self) -> Result<Vec<String>> {
        // TODO: Download and parse repository index
        Ok(vec![])
    }

    /// Download a package
    pub async fn download_package(&self, name: &str, version: &str) -> Result<Vec<u8>> {
        // TODO: Download package from repository
        Ok(vec![])
    }
}
