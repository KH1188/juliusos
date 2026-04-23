#!/bin/bash
# Terminal Mode Launcher

JUSH="/home/julius/juliusos/distro/jush/target/release/jush"

echo "💻 Launching Terminal Mode..."

if [ -f "$JUSH" ]; then
    # Launch jush shell
    exec "$JUSH"
else
    echo "❌ jush not found. Building..."
    cd /home/julius/juliusos
    make build-jush

    if [ -f "$JUSH" ]; then
        exec "$JUSH"
    else
        echo "❌ Failed to build jush"
        exit 1
    fi
fi
