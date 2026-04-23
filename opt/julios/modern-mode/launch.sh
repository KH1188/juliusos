#!/bin/bash
# Modern Mode Launcher (Placeholder)

DESKTOP_APP="/home/julius/juliusos/apps/desktop"

echo "🌐 Launching Modern Mode..."
echo ""
echo "Modern Mode will feature:"
echo "  - Brutalist web design"
echo "  - Smooth scrolling portfolio"
echo "  - Interactive project showcases"
echo "  - Integrated chatbot"
echo ""
echo "For now, launching the existing JuliOS desktop app as a preview..."
echo ""

# Try to launch the existing desktop app
if [ -d "$DESKTOP_APP" ]; then
    cd "$DESKTOP_APP"
    npm run tauri dev 2>/dev/null &
fi

read -p "Press Enter to continue..."
