#!/bin/bash
# Create minimal root filesystem for JuliOS

set -e

ROOTFS_DIR="${1:-./rootfs}"

echo "Creating JuliOS root filesystem at $ROOTFS_DIR"

# Create standard FHS directories
mkdir -p "$ROOTFS_DIR"/{bin,sbin,lib,lib64,etc,dev,proc,sys,tmp,run,var,usr,home,root,opt}
mkdir -p "$ROOTFS_DIR"/usr/{bin,sbin,lib,lib64,share,include,local}
mkdir -p "$ROOTFS_DIR"/var/{log,lib,cache,tmp,lock}
mkdir -p "$ROOTFS_DIR"/etc/{juinit,jupm}
mkdir -p "$ROOTFS_DIR"/etc/juinit/{services,targets}

# JuliOS-specific directories
mkdir -p "$ROOTFS_DIR"/julios/{apps,data,services,ui}
mkdir -p "$ROOTFS_DIR"/julios/services/{api,agents}

# Create device nodes (requires root, skip if not root)
if [ "$EUID" -eq 0 ]; then
    echo "Creating device nodes..."
    mknod -m 666 "$ROOTFS_DIR/dev/null" c 1 3
    mknod -m 666 "$ROOTFS_DIR/dev/zero" c 1 5
    mknod -m 666 "$ROOTFS_DIR/dev/random" c 1 8
    mknod -m 666 "$ROOTFS_DIR/dev/urandom" c 1 9
    mknod -m 600 "$ROOTFS_DIR/dev/console" c 5 1
    mknod -m 666 "$ROOTFS_DIR/dev/tty" c 5 0
else
    echo "Skipping device nodes (not root)"
fi

# Set permissions
chmod 1777 "$ROOTFS_DIR/tmp"
chmod 1777 "$ROOTFS_DIR/var/tmp"
chmod 755 "$ROOTFS_DIR/root"

# Create essential symlinks
ln -sf usr/bin "$ROOTFS_DIR/bin" 2>/dev/null || true
ln -sf usr/sbin "$ROOTFS_DIR/sbin" 2>/dev/null || true
ln -sf usr/lib "$ROOTFS_DIR/lib" 2>/dev/null || true
ln -sf usr/lib64 "$ROOTFS_DIR/lib64" 2>/dev/null || true

# Create /etc/passwd
cat > "$ROOTFS_DIR/etc/passwd" << 'EOF'
root:x:0:0:root:/root:/bin/jush
julios:x:1000:1000:JuliOS User:/home/julios:/bin/jush
EOF

# Create /etc/group
cat > "$ROOTFS_DIR/etc/group" << 'EOF'
root:x:0:
julios:x:1000:
EOF

# Create /etc/shadow (empty, for security)
touch "$ROOTFS_DIR/etc/shadow"
chmod 600 "$ROOTFS_DIR/etc/shadow"

# Create /etc/hostname
echo "julios" > "$ROOTFS_DIR/etc/hostname"

# Create /etc/hosts
cat > "$ROOTFS_DIR/etc/hosts" << 'EOF'
127.0.0.1   localhost
127.0.1.1   julios
::1         localhost ip6-localhost ip6-loopback
EOF

# Create /etc/fstab
cat > "$ROOTFS_DIR/etc/fstab" << 'EOF'
# <filesystem> <mount point> <type> <options> <dump> <pass>
proc           /proc         proc   defaults   0      0
sysfs          /sys          sysfs  defaults   0      0
devtmpfs       /dev          devtmpfs defaults 0      0
tmpfs          /tmp          tmpfs  defaults   0      0
tmpfs          /run          tmpfs  defaults   0      0
EOF

# Create /etc/profile
cat > "$ROOTFS_DIR/etc/profile" << 'EOF'
# JuliOS system-wide profile

export PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/julios/bin
export HOME=/root
export USER=root
export SHELL=/bin/jush

# JuliOS-specific environment
export JULIOS_ROOT=/julios
export JULIOS_DATA=/julios/data
export JULIOS_CONFIG=/etc/julios

# Load user profile if it exists
[ -f "$HOME/.profile" ] && . "$HOME/.profile"
EOF

# Create inittab for juinit
cat > "$ROOTFS_DIR/etc/juinit/inittab" << 'EOF'
# JuliOS init configuration

# Default runlevel (equivalent to systemd's default.target)
default=multi-user.target

# Console setup
console=/dev/console
EOF

# Create default.target
cat > "$ROOTFS_DIR/etc/juinit/targets/default.target" << 'EOF'
# Default target - multi-user system
requires=multi-user.target
EOF

# Create multi-user.target
cat > "$ROOTFS_DIR/etc/juinit/targets/multi-user.target" << 'EOF'
# Multi-user target
requires=basic.target network.target
EOF

# Create basic.target
cat > "$ROOTFS_DIR/etc/juinit/targets/basic.target" << 'EOF'
# Basic system target
requires=
EOF

# Create a basic init service for juinit
cat > "$ROOTFS_DIR/etc/juinit/services/syslog.toml" << 'EOF'
[service]
name = "syslog"
description = "System logging service"
type = "simple"

[service.exec]
start = "/usr/sbin/syslogd -n"
stop = "/bin/kill -TERM $MAINPID"

[service.dependencies]
after = []
requires = []

[service.restart]
policy = "on-failure"
delay_seconds = 5
max_retries = 3
EOF

# Create jupm configuration
cat > "$ROOTFS_DIR/etc/jupm/jupm.toml" << 'EOF'
# JuliOS Package Manager Configuration

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

[database]
path = "/var/lib/jupm/packages.db"
EOF

# Create directory for jupm database
mkdir -p "$ROOTFS_DIR/var/lib/jupm"

# Create README
cat > "$ROOTFS_DIR/README.txt" << 'EOF'
JuliOS Root Filesystem
======================

This is the minimal root filesystem for JuliOS.

Directory Structure:
- /bin, /sbin, /lib, /lib64 -> symlinks to /usr/*
- /etc - Configuration files
- /etc/juinit - Init system configuration
- /etc/jupm - Package manager configuration
- /julios - JuliOS-specific applications and data
- /home - User home directories
- /root - Root user home
- /var - Variable data (logs, cache, etc.)

Init System: juinit
Package Manager: jupm
Shell: jush

To populate this filesystem:
1. Build JuliOS components (juinit, jupm, jush)
2. Install them to this rootfs
3. Install required packages (coreutils, bash alternatives, etc.)
4. Create a bootable image or container

See distro/build/README.md for more information.
EOF

echo ""
echo "✓ Root filesystem created at $ROOTFS_DIR"
echo ""
echo "Directory structure:"
ls -la "$ROOTFS_DIR"
echo ""
echo "Next steps:"
echo "  1. Build JuliOS components: make build-distro"
echo "  2. Install to rootfs: ./install-to-rootfs.sh"
echo "  3. Create packages or ISO"
