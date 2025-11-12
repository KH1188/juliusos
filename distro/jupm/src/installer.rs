use anyhow::{Result, Context, bail};
use std::path::{Path, PathBuf};
use std::fs::{self, File};
use std::io::{Read, Write};
use tar::Archive;
use flate2::read::GzDecoder;
use crate::package::PackageMetadata;
use crate::database::{PackageDatabase, PackageEntry};

/// Package installer
pub struct Installer {
    db: PackageDatabase,
    root: PathBuf,
}

impl Installer {
    pub async fn new(root: Option<PathBuf>) -> Result<Self> {
        let db = PackageDatabase::new().await?;
        let root = root.unwrap_or_else(|| PathBuf::from("/"));

        Ok(Self { db, root })
    }

    /// Install a package from .jup file
    pub async fn install_from_file(&self, path: &str) -> Result<()> {
        let path = Path::new(path);

        if !path.exists() {
            bail!("Package file not found: {}", path.display());
        }

        // Extract to temporary directory
        let temp_dir = tempfile::tempdir()?;
        self.extract_package(path, temp_dir.path())?;

        // Read metadata
        let metadata_path = temp_dir.path().join("metadata.toml");
        let metadata = self.read_metadata(&metadata_path)?;

        println!("Installing package: {} v{}",
            metadata.package.name,
            metadata.package.version
        );

        // Run pre-install script if it exists
        self.run_script(temp_dir.path(), "pre-install.sh")?;

        // Extract files to root
        let files_archive = temp_dir.path().join("files.tar.gz");
        let installed_files = self.install_files(&files_archive)?;

        // Register in database
        let entry = PackageEntry {
            name: metadata.package.name.clone(),
            version: metadata.package.version.clone(),
            architecture: metadata.package.architecture.clone(),
            installed: true,
            files: installed_files,
            dependencies: metadata.dependencies.runtime.clone(),
        };

        self.db.install_package(entry).await?;

        // Run post-install script if it exists
        self.run_script(temp_dir.path(), "post-install.sh")?;

        println!("✓ Package installed successfully");

        Ok(())
    }

    /// Remove an installed package
    pub async fn remove_package(&self, name: &str) -> Result<()> {
        // Get package info from database
        let package = self.db.get_package(name).await?
            .context(format!("Package '{}' is not installed", name))?;

        println!("Removing package: {}", name);

        // TODO: Run pre-remove script

        // Remove files
        for file in &package.files {
            let file_path = self.root.join(file.trim_start_matches('/'));
            if file_path.exists() {
                fs::remove_file(&file_path)
                    .context(format!("Failed to remove file: {}", file_path.display()))?;
                println!("  Removed: {}", file);
            }
        }

        // Remove from database
        self.db.remove_package(name).await?;

        // TODO: Run post-remove script

        println!("✓ Package removed successfully");

        Ok(())
    }

    /// Extract .jup package (tar.gz) to a directory
    fn extract_package(&self, package_path: &Path, dest: &Path) -> Result<()> {
        let file = File::open(package_path)?;
        let decoder = GzDecoder::new(file);
        let mut archive = Archive::new(decoder);
        archive.unpack(dest)?;
        Ok(())
    }

    /// Read package metadata from metadata.toml
    fn read_metadata(&self, path: &Path) -> Result<PackageMetadata> {
        let contents = fs::read_to_string(path)?;
        let metadata: PackageMetadata = toml::from_str(&contents)?;
        Ok(metadata)
    }

    /// Install files from files.tar.gz to the root filesystem
    fn install_files(&self, archive_path: &Path) -> Result<Vec<String>> {
        let mut installed = Vec::new();

        if !archive_path.exists() {
            return Ok(installed);
        }

        let file = File::open(archive_path)?;
        let decoder = GzDecoder::new(file);
        let mut archive = Archive::new(decoder);

        for entry in archive.entries()? {
            let mut entry = entry?;
            let path = entry.path()?.to_path_buf(); // Convert to owned PathBuf
            let dest_path = self.root.join(&path);

            // Create parent directories
            if let Some(parent) = dest_path.parent() {
                fs::create_dir_all(parent)?;
            }

            // Extract file
            entry.unpack(&dest_path)?;
            let display_path = format!("/{}", path.display());
            installed.push(display_path.clone());

            println!("  Installed: {}", display_path);
        }

        Ok(installed)
    }

    /// Run a script from the package
    fn run_script(&self, package_dir: &Path, script_name: &str) -> Result<()> {
        let script_path = package_dir.join("scripts").join(script_name);

        if !script_path.exists() {
            return Ok(());
        }

        println!("  Running {}...", script_name);

        let output = std::process::Command::new("sh")
            .arg(&script_path)
            .current_dir(package_dir)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            bail!("Script {} failed: {}", script_name, stderr);
        }

        Ok(())
    }
}
