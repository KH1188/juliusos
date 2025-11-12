#!/bin/bash
# Install JuliOS components to root filesystem

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOTFS_DIR="${1:-$SCRIPT_DIR/rootfs}"

echo "Installing JuliOS components to $ROOTFS_DIR"

# Check if rootfs exists
if [ ! -d "$ROOTFS_DIR" ]; then
    echo "Error: Root filesystem not found at $ROOTFS_DIR"
    echo "Run ./create-rootfs.sh first"
    exit 1
fi

# Build all components
echo "Building JuliOS components..."
cd "$PROJECT_ROOT"
make build-distro

# Install juinit
echo "Installing juinit..."
install -D -m 755 "$PROJECT_ROOT/distro/juinit/target/release/juinit" "$ROOTFS_DIR/usr/bin/juinit"
ln -sf /usr/bin/juinit "$ROOTFS_DIR/sbin/init"

# Install jupm
echo "Installing jupm..."
install -D -m 755 "$PROJECT_ROOT/distro/jupm/target/release/jupm" "$ROOTFS_DIR/usr/bin/jupm"

# Install jush
echo "Installing jush..."
install -D -m 755 "$PROJECT_ROOT/distro/jush/target/release/jush" "$ROOTFS_DIR/usr/bin/jush"
ln -sf /usr/bin/jush "$ROOTFS_DIR/bin/sh"

# Copy test services
echo "Installing test services..."
if [ -d "$PROJECT_ROOT/distro/juinit/test-services" ]; then
    cp "$PROJECT_ROOT/distro/juinit/test-services"/*.toml "$ROOTFS_DIR/etc/juinit/services/" 2>/dev/null || true
fi

# Copy example service
if [ -f "$PROJECT_ROOT/distro/juinit/examples/julios-api.toml" ]; then
    cp "$PROJECT_ROOT/distro/juinit/examples/julios-api.toml" "$ROOTFS_DIR/etc/juinit/services/"
fi

echo ""
echo "✓ JuliOS components installed to $ROOTFS_DIR"
echo ""
echo "Installed components:"
ls -lh "$ROOTFS_DIR/usr/bin/"ju*
echo ""
echo "Services available:"
ls "$ROOTFS_DIR/etc/juinit/services/"
echo ""
echo "Next steps:"
echo "  - Test in chroot: sudo chroot $ROOTFS_DIR /bin/jush"
echo "  - Create container: ./create-container.sh"
echo "  - Create ISO: ./create-iso.sh"
