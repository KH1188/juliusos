use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, sqlite::SqliteConnectOptions};
use std::path::Path;
use std::str::FromStr;

const DEFAULT_DB_PATH: &str = "/var/lib/jupm/packages.db";

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
    pool: SqlitePool,
}

impl PackageDatabase {
    pub async fn new() -> Result<Self> {
        let db_path = std::env::var("JUPM_DB_PATH").unwrap_or_else(|_| {
            // Use /tmp for development if /var/lib doesn't exist
            if Path::new("/var/lib").exists() {
                DEFAULT_DB_PATH.to_string()
            } else {
                "/tmp/jupm-packages.db".to_string()
            }
        });

        // Create parent directory if needed
        if let Some(parent) = Path::new(&db_path).parent() {
            std::fs::create_dir_all(parent).ok();
        }

        // Connect to database
        let options = SqliteConnectOptions::from_str(&format!("sqlite:{}", db_path))?
            .create_if_missing(true);

        let pool = SqlitePool::connect_with(options).await?;

        // Create tables
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS packages (
                name TEXT PRIMARY KEY,
                version TEXT NOT NULL,
                architecture TEXT NOT NULL,
                installed INTEGER NOT NULL DEFAULT 1,
                installed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            "#,
        )
        .execute(&pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS package_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                package_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                FOREIGN KEY (package_name) REFERENCES packages(name) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS package_dependencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                package_name TEXT NOT NULL,
                dependency TEXT NOT NULL,
                FOREIGN KEY (package_name) REFERENCES packages(name) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&pool)
        .await?;

        Ok(Self { pool })
    }

    pub async fn get_package(&self, name: &str) -> Result<Option<PackageEntry>> {
        let row: Option<(String, String, String, i64)> = sqlx::query_as(
            "SELECT name, version, architecture, installed FROM packages WHERE name = ?"
        )
        .bind(name)
        .fetch_optional(&self.pool)
        .await?;

        if let Some((pkg_name, version, architecture, installed)) = row {
            let files = self.get_package_files(&pkg_name).await?;
            let dependencies = self.get_package_dependencies(&pkg_name).await?;

            Ok(Some(PackageEntry {
                name: pkg_name,
                version,
                architecture,
                installed: installed != 0,
                files,
                dependencies,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn list_installed(&self) -> Result<Vec<PackageEntry>> {
        let rows: Vec<(String, String, String)> = sqlx::query_as(
            "SELECT name, version, architecture FROM packages WHERE installed = 1"
        )
        .fetch_all(&self.pool)
        .await?;

        let mut packages = Vec::new();

        for (name, version, architecture) in rows {
            let files = self.get_package_files(&name).await?;
            let dependencies = self.get_package_dependencies(&name).await?;

            packages.push(PackageEntry {
                name,
                version,
                architecture,
                installed: true,
                files,
                dependencies,
            });
        }

        Ok(packages)
    }

    pub async fn install_package(&self, package: PackageEntry) -> Result<()> {
        // Insert package
        sqlx::query(
            "INSERT OR REPLACE INTO packages (name, version, architecture, installed) VALUES (?, ?, ?, 1)"
        )
        .bind(&package.name)
        .bind(&package.version)
        .bind(&package.architecture)
        .execute(&self.pool)
        .await?;

        // Insert files
        for file in &package.files {
            sqlx::query(
                "INSERT INTO package_files (package_name, file_path) VALUES (?, ?)"
            )
            .bind(&package.name)
            .bind(file)
            .execute(&self.pool)
            .await?;
        }

        // Insert dependencies
        for dep in &package.dependencies {
            sqlx::query(
                "INSERT INTO package_dependencies (package_name, dependency) VALUES (?, ?)"
            )
            .bind(&package.name)
            .bind(dep)
            .execute(&self.pool)
            .await?;
        }

        Ok(())
    }

    pub async fn remove_package(&self, name: &str) -> Result<()> {
        sqlx::query("DELETE FROM packages WHERE name = ?")
            .bind(name)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    async fn get_package_files(&self, package_name: &str) -> Result<Vec<String>> {
        let rows: Vec<(String,)> = sqlx::query_as(
            "SELECT file_path FROM package_files WHERE package_name = ?"
        )
        .bind(package_name)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|r| r.0).collect())
    }

    async fn get_package_dependencies(&self, package_name: &str) -> Result<Vec<String>> {
        let rows: Vec<(String,)> = sqlx::query_as(
            "SELECT dependency FROM package_dependencies WHERE package_name = ?"
        )
        .bind(package_name)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|r| r.0).collect())
    }
}
