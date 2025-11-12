# jupm - JuliOS Package Manager

A modern package manager for JuliOS with Debian compatibility.

## Features

- **Native Package Format**: `.jup` packages (tar.zst with metadata)
- **Debian Compatible**: Can install `.deb` packages
- **Dependency Resolution**: Automatic dependency handling
- **Repository Management**: Multiple repository support
- **Fast**: Parallel downloads and installations
- **Secure**: Package signature verification
- **Integrated**: Works with juinit for service management

## Architecture

```
jupm
├── Core (Rust)
│   ├── Package resolver
│   ├── Download manager
│   ├── Installation engine
│   └── Database
├── Repository
│   ├── Package index
│   ├── Metadata
│   └── Signatures
└── CLI
    ├── install/remove
    ├── search/list
    └── update/upgrade
```

## Package Format (.jup)

A `.jup` package is a compressed archive containing:

```
package.jup (tar.zst)
├── metadata.toml       # Package information
├── files.tar.zst       # Actual files to install
├── scripts/
│   ├── pre-install.sh
│   ├── post-install.sh
│   ├── pre-remove.sh
│   └── post-remove.sh
└── signature           # GPG signature
```

### metadata.toml Example

```toml
[package]
name = "julios-desktop"
version = "0.1.0"
architecture = "x86_64"
description = "JuliOS Desktop Environment"
homepage = "https://julios.org"
license = "MIT"

[package.maintainer]
name = "JuliOS Team"
email = "team@julios.org"

[dependencies]
runtime = [
    "julios-api >= 0.1.0",
    "julios-agent >= 0.1.0",
    "wayland >= 1.20",
]

[services]
units = ["julios-desktop.toml"]

[files]
install_to = "/"
preserve_config = true
```

## Usage

### Installing Packages

```bash
# Install a package
jupm install julios-desktop

# Install from local file
jupm install ./package.jup

# Install .deb package
jupm install package.deb

# Install multiple packages
jupm install pkg1 pkg2 pkg3
```

### Removing Packages

```bash
# Remove a package
jupm remove julios-desktop

# Remove with dependencies
jupm autoremove julios-desktop
```

### Searching and Information

```bash
# Search for packages
jupm search editor

# Show package info
jupm info julios-desktop

# List installed packages
jupm list

# List files in a package
jupm files julios-desktop
```

### Repository Management

```bash
# Update package index
jupm update

# Upgrade all packages
jupm upgrade

# Add a repository
jupm repo add main https://repo.julios.org/main

# List repositories
jupm repo list

# Remove a repository
jupm repo remove main
```

### System Maintenance

```bash
# Clean package cache
jupm clean

# Check for broken dependencies
jupm check

# Verify installed packages
jupm verify
```

## Configuration

Main config: `/etc/jupm/jupm.toml`

```toml
[repositories]
main = "https://repo.julios.org/main"
contrib = "https://repo.julios.org/contrib"

[cache]
directory = "/var/cache/jupm"
max_size_mb = 1024

[install]
parallel_downloads = 4
verify_signatures = true
auto_remove_deps = false
```

## Building Packages

```bash
# Create package from directory
jupm build ./mypackage

# Sign package
jupm sign package.jup

# Validate package
jupm validate package.jup
```

## Debian Compatibility Layer

jupm can install `.deb` packages by:
1. Extracting the package
2. Converting dpkg metadata to jupm format
3. Installing files to the correct locations
4. Registering in jupm database

This allows using Debian packages while maintaining jupm as the primary package manager.

## Implementation Status

- [ ] Core package database
- [ ] Dependency resolver
- [ ] Package download manager
- [ ] Installation/removal engine
- [ ] Repository management
- [ ] .jup format parser
- [ ] .deb compatibility layer
- [ ] CLI interface
- [ ] Package signing/verification
