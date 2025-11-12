#!/bin/bash
# Build a .jup package from a package directory

set -e

PACKAGE_DIR="$1"

if [ -z "$PACKAGE_DIR" ] || [ ! -d "$PACKAGE_DIR" ]; then
    echo "Usage: $0 <package-directory>"
    echo ""
    echo "Package directory should contain:"
    echo "  - metadata.toml (required)"
    echo "  - files/ (directory with files to install)"
    echo "  - scripts/ (optional pre/post install scripts)"
    exit 1
fi

PACKAGE_DIR="$(cd "$PACKAGE_DIR" && pwd)"
PACKAGE_NAME="$(basename "$PACKAGE_DIR")"
OUTPUT_DIR="$(dirname "$PACKAGE_DIR")"

echo "Building package: $PACKAGE_NAME"
echo "Source: $PACKAGE_DIR"

# Check for required files
if [ ! -f "$PACKAGE_DIR/metadata.toml" ]; then
    echo "Error: metadata.toml not found"
    exit 1
fi

# Create temporary build directory
BUILD_DIR=$(mktemp -d)
trap "rm -rf $BUILD_DIR" EXIT

echo "Temp build dir: $BUILD_DIR"

# Copy metadata
cp "$PACKAGE_DIR/metadata.toml" "$BUILD_DIR/"

# Create files archive if files directory exists
if [ -d "$PACKAGE_DIR/files" ]; then
    echo "Creating files archive..."
    cd "$PACKAGE_DIR/files"
    tar czf "$BUILD_DIR/files.tar.gz" .
    echo "  $(tar tzf "$BUILD_DIR/files.tar.gz" | wc -l) files"
fi

# Copy scripts if they exist
if [ -d "$PACKAGE_DIR/scripts" ]; then
    echo "Copying scripts..."
    cp -r "$PACKAGE_DIR/scripts" "$BUILD_DIR/"
    ls "$BUILD_DIR/scripts/"
fi

# Create the .jup package
echo "Creating $PACKAGE_NAME.jup..."
cd "$BUILD_DIR"
tar czf "$OUTPUT_DIR/$PACKAGE_NAME.jup" *

echo ""
echo "✓ Package created: $OUTPUT_DIR/$PACKAGE_NAME.jup"
ls -lh "$OUTPUT_DIR/$PACKAGE_NAME.jup"

# Show package contents
echo ""
echo "Package contents:"
tar tzf "$OUTPUT_DIR/$PACKAGE_NAME.jup"
