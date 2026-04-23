#!/bin/bash
# Desktop Mode Launcher - Amiga Workbench Style

DESKTOP_HTML="/home/julius/juliusos/opt/julios/desktop-mode/index.html"

echo "🖥️  Launching JuliOS Desktop Mode..."
echo "   Amiga Workbench-inspired interface"
echo ""

# Try different browsers
if command -v chromium-browser &> /dev/null; then
    chromium-browser --new-window --app="file://$DESKTOP_HTML" &
elif command -v chromium &> /dev/null; then
    chromium --new-window --app="file://$DESKTOP_HTML" &
elif command -v google-chrome &> /dev/null; then
    google-chrome --new-window --app="file://$DESKTOP_HTML" &
elif command -v firefox &> /dev/null; then
    firefox --new-window "file://$DESKTOP_HTML" &
else
    echo "❌ No browser found. Please install chromium or firefox."
    exit 1
fi

echo "✅ Desktop Mode launched!"
