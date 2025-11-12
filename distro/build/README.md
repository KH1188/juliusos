# JuliOS Build System

This directory contains scripts and tools for building JuliOS distribution components.

## Quick Start

```bash
# 1. Create minimal root filesystem
./create-rootfs.sh

# 2. Build JuliOS components
cd ../..
make build-distro

# 3. Install to rootfs
cd distro/build
./install-to-rootfs.sh

# 4. Build example package
./build-package.sh packages/hello-world

# 5. Test the package
# (In a container or chroot environment)
```

## Scripts

### create-rootfs.sh
Creates a minimal FHS-compliant root filesystem for JuliOS.

**Usage:**
```bash
./create-rootfs.sh [output-directory]
```

**What it creates:**
- Standard FHS directories (`/bin`, `/etc`, `/usr`, etc.)
- JuliOS-specific directories (`/julios/`)
- Essential configuration files (`/etc/passwd`, `/etc/hosts`, etc.)
- juinit configuration (`/etc/juinit/`)
- jupm configuration (`/etc/jupm/`)

**Output:**
- Minimal bootable filesystem structure
- Ready for component installation

### install-to-rootfs.sh
Installs built JuliOS components into a root filesystem.

**Usage:**
```bash
./install-to-rootfs.sh [rootfs-directory]
```

**Installs:**
- `juinit` → `/usr/bin/juinit`, `/sbin/init`
- `jupm` → `/usr/bin/jupm`
- `jush` → `/usr/bin/jush`, `/bin/sh`
- Test services → `/etc/juinit/services/`

**Prerequisites:**
- Root filesystem must exist (run `create-rootfs.sh` first)
- JuliOS components must be built (`make build-distro`)

### build-package.sh
Builds a `.jup` package from a package directory.

**Usage:**
```bash
./build-package.sh <package-directory>
```

**Package Structure:**
```
package-name/
├── metadata.toml       # Required: package metadata
├── files/             # Optional: files to install
│   └── usr/bin/...    # Install paths relative to root
└── scripts/           # Optional: install scripts
    ├── pre-install.sh
    ├── post-install.sh
    ├── pre-remove.sh
    └── post-remove.sh
```

**Output:**
- `package-name.jup` (tar.gz archive)

**Example metadata.toml:**
```toml
[package]
name = "my-package"
version = "1.0.0"
architecture = "x86_64"
description = "My awesome package"
license = "MIT"

[package.maintainer]
name = "Your Name"
email = "you@example.com"

[dependencies]
runtime = ["dependency1", "dependency2"]

[files]
install_to = "/"
preserve_config = false
```

### systemd-to-juinit.py
Converts systemd service files to juinit TOML format.

**Usage:**
```bash
./systemd-to-juinit.py <systemd-service-file> [output-file]
```

**Example:**
```bash
# Convert sshd service
./systemd-to-juinit.py /lib/systemd/system/sshd.service sshd.toml

# Output will be in juinit TOML format
cp sshd.toml /etc/juinit/services/
```

**Features:**
- Converts [Unit], [Service], and [Install] sections
- Maps systemd service types to juinit types
- Handles dependencies (After, Requires, Wants)
- Converts restart policies
- Extracts environment variables

**Limitations:**
- Approximate conversion (review output!)
- Some systemd features not supported
- Complex ExecStart commands may need adjustment

## Directory Structure

```
distro/build/
├── README.md                 # This file
├── create-rootfs.sh          # Create minimal root filesystem
├── install-to-rootfs.sh      # Install JuliOS components
├── build-package.sh          # Build .jup packages
├── systemd-to-juinit.py      # Convert systemd services
├── packages/                 # Example packages
│   └── hello-world/          # Hello world example
└── rootfs/                   # Generated root filesystem (gitignored)
```

## Example Packages

### hello-world
Simple hello world program demonstrating package structure.

**Build:**
```bash
./build-package.sh packages/hello-world
```

**Install:**
```bash
# In target system or rootfs:
jupm install packages/hello-world.jup
hello
```

## Creating Your Own Package

1. **Create package directory:**
```bash
mkdir packages/my-app
cd packages/my-app
```

2. **Create metadata.toml:**
```toml
[package]
name = "my-app"
version = "1.0.0"
architecture = "x86_64"
description = "My application"
license = "MIT"

[package.maintainer]
name = "Your Name"
email = "you@example.com"

[dependencies]
runtime = []

[files]
install_to = "/"
```

3. **Add files:**
```bash
mkdir -p files/usr/bin
cp my-binary files/usr/bin/
chmod +x files/usr/bin/my-binary
```

4. **Add scripts (optional):**
```bash
mkdir scripts
cat > scripts/post-install.sh << 'EOF'
#!/bin/sh
echo "my-app installed successfully!"
EOF
chmod +x scripts/post-install.sh
```

5. **Build package:**
```bash
cd ../..
./build-package.sh packages/my-app
```

6. **Test package:**
```bash
# Extract and inspect
mkdir test
cd test
tar xzf ../packages/my-app.jup
cat metadata.toml
```

## Root Filesystem Testing

### Using chroot
```bash
# As root:
sudo chroot rootfs /bin/jush

# Inside chroot:
juinit --help
jupm list
jush
```

### Using systemd-nspawn
```bash
sudo systemd-nspawn -D rootfs /bin/jush
```

### Using Docker
```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM scratch
ADD rootfs/ /
CMD ["/bin/jush"]
EOF

docker build -t julios .
docker run -it julios
```

## Integration with Main Makefile

From project root:

```bash
# Build all distro components
make build-distro

# Build individual components
make build-juinit
make build-jupm
make build-jush

# Clean build artifacts
make clean-distro
```

## Next Steps

1. **Create more packages:**
   - coreutils (ls, cat, grep, etc.)
   - Network tools (curl, wget)
   - System utilities (top, ps)

2. **Build bootable image:**
   - Create initramfs
   - Configure bootloader
   - Build ISO

3. **Set up QEMU testing:**
   - Test boot process
   - Verify service management
   - Test package installation

4. **Create repository:**
   - Package index
   - HTTP server
   - Signature verification

## Resources

- [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)
- [Linux From Scratch](https://www.linuxfromscratch.org/)
- [Debian Policy Manual](https://www.debian.org/doc/debian-policy/)

## Troubleshooting

**Problem:** "Permission denied" when running scripts
- **Solution:** Make sure scripts are executable: `chmod +x script.sh`

**Problem:** Components not found in rootfs
- **Solution:** Run `./install-to-rootfs.sh` after building

**Problem:** Package build fails
- **Solution:** Check that metadata.toml exists and is valid TOML

**Problem:** Service conversion incomplete
- **Solution:** systemd-to-juinit.py is approximate - review and adjust manually

## Contributing

When adding new build scripts or packages:
1. Follow existing patterns
2. Add documentation to this README
3. Test thoroughly
4. Update relevant Makefiles
