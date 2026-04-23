# JuliOS Showcase OS - Quick Start Guide

Welcome to the JuliOS transformation! This guide will help you explore the new showcase operating system features.

## 🎯 What's New?

JuliOS is being transformed from a desktop life management app into a **bootable showcase operating system** with three distinct interface modes:

1. **🖥️ Desktop Mode** - Retro pixel-art GUI with draggable windows
2. **💻 Terminal Mode** - Command-line portfolio browser
3. **🌐 Modern Mode** - Brutalist web-based showcase

## 🚀 Try It Now!

### Launch the Mode Selector

```bash
cd /home/julius/juliusos
make mode-selector
```

Or use the shortcut:

```bash
make showcase
```

### What You'll See

The Mode Selector is a beautiful GTK3 application with:
- Retro-futuristic design (blacks, purples, golds)
- ASCII art JuliOS banner
- Three large mode selection buttons
- Visitor counter
- Keyboard shortcuts (1-3 for quick select)

### Keyboard Shortcuts

- **1** - Launch Desktop Mode
- **2** - Launch Terminal Mode
- **3** - Launch Modern Mode
- **F11** - Toggle fullscreen
- **ESC** - Exit
- **Ctrl+Q** - Quit

## 📁 Project Structure

```
juliusos/
├── opt/julios/                    # New showcase OS components
│   ├── mode-selector/             # ✅ COMPLETE
│   │   ├── mode-selector.py       # Main GTK3 app
│   │   └── README.md              # Documentation
│   │
│   ├── bin/
│   │   └── julios                 # Main launcher script
│   │
│   ├── desktop-mode/              # 🚧 Coming soon
│   │   └── launch.sh              # Placeholder
│   │
│   ├── terminal-mode/             # 🚧 In progress (uses jush)
│   │   └── launch.sh              # Uses existing jush shell
│   │
│   └── modern-mode/               # 🚧 Coming soon
│       └── launch.sh              # Placeholder
│
├── distro/                        # OS distribution components
│   ├── juinit/                    # Init system
│   ├── jupm/                      # Package manager
│   ├── jush/                      # Shell (used by Terminal Mode)
│   └── SHOWCASE_OS_DESIGN.md      # 📄 Full architecture doc
│
├── apps/desktop/                  # Original desktop app (still works!)
└── services/                      # API and agents
```

## 🎨 What's Implemented?

### ✅ Mode Selector (COMPLETE)
- Beautiful GTK3 interface
- Visitor tracking (stored in `~/.julios/state.json`)
- Session history
- Keyboard shortcuts
- Fullscreen support
- Launch handlers for all three modes

### 🚧 Desktop Mode (Placeholder)
- Shows info dialog
- Ready for implementation

### 🚧 Terminal Mode (Partial)
- Launches jush shell (if built)
- Portfolio CLI commands coming soon

### 🚧 Modern Mode (Placeholder)
- Shows info dialog
- Can optionally launch existing desktop app

## 📊 Visitor Tracking

Every time you launch the mode selector, it:
1. Increments visitor count
2. Records which mode you select
3. Saves session history

View your stats:

```bash
cat ~/.julios/state.json
```

Example output:
```json
{
  "visitors": 5,
  "last_mode": "terminal",
  "mode_selections": {
    "desktop": 2,
    "terminal": 3,
    "modern": 0
  },
  "sessions": [
    {
      "timestamp": "2025-11-12T08:30:00",
      "mode": "terminal"
    }
  ]
}
```

## 🛠️ Development

### Build Required Components

```bash
# Build all distro components (including jush for Terminal Mode)
make build-distro

# Or build individually
make build-jush
```

### Test Mode Selector

```bash
# Launch mode selector
make mode-selector

# Or directly
python3 opt/julios/mode-selector/mode-selector.py
```

### Dependencies

The mode selector requires:
- Python 3.6+
- GTK 3
- python3-gi (PyGObject)

Check dependencies:
```bash
python3 -c "import gi; gi.require_version('Gtk', '3.0'); from gi.repository import Gtk; print('GTK3 OK')"
```

## 📖 Documentation

- **Full Architecture**: `distro/SHOWCASE_OS_DESIGN.md` - Complete system design
- **Mode Selector**: `opt/julios/mode-selector/README.md` - Detailed mode selector docs
- **Original Design**: `ARCHITECTURE.md` - Original life management app architecture

## 🎯 Next Steps

### Immediate (This Week)
1. ✅ Mode Selector - **DONE!**
2. 🚧 Terminal Mode - Enhance jush with portfolio commands
3. 🚧 Desktop Mode - Build retro GUI with Electron/GTK

### Short-term (Next 2 Weeks)
4. Modern Mode - Build React SPA with Brutalist design
5. Portfolio Content - Add projects, resume, gallery
6. Analytics Service - Track visitor interactions

### Long-term (Next Month)
7. ISO Build System - Create bootable image
8. Auto-boot Setup - Configure GRUB and X session
9. QEMU Testing - Test in virtual machine
10. USB Boot - Test on real hardware

## 🎮 Try Different Modes

### Desktop Mode (Coming Soon)
Will launch a retro pixel-art GUI with:
- Draggable windows for Resume, Projects, Gallery
- Status bar with system info
- Taskbar with portfolio apps
- CRT scanline effects

### Terminal Mode (Partial)
Currently launches jush shell. Will add:
- Portfolio commands: `open farm-smart`, `gallery`, `projects`
- Interactive navigation: `ls`, `cd`, `cat`
- Chat interface: `chat`
- System commands: `visitors`, `about`, `skills`

### Modern Mode (Coming Soon)
Will launch a brutalist web SPA with:
- Smooth scrolling sections
- Bold typography
- Interactive project cards
- Integrated chatbot widget

## 🐛 Troubleshooting

### "No X display found"
The mode selector requires X11. Make sure you're running in a graphical environment.

### "GTK3 not found"
Install GTK3:
```bash
sudo apt install python3-gi gir1.2-gtk-3.0
```

### Mode doesn't launch
Check the launcher scripts in `opt/julios/*/launch.sh` - they may need paths updated.

## 💡 Tips

- Press **F11** in mode selector for fullscreen kiosk experience
- Use number keys **1-3** for quick mode selection
- Check `~/.julios/state.json` to see your usage stats
- The mode selector remembers your last selected mode

## 🎨 Customization

### Change Theme Colors

Edit `opt/julios/mode-selector/mode-selector.py` in the `apply_theme()` function:

```python
.title-label {
    color: #f59e0b;  # Gold - change this!
}
```

### Modify Launch Behavior

Edit the launch scripts:
- `opt/julios/desktop-mode/launch.sh`
- `opt/julios/terminal-mode/launch.sh`
- `opt/julios/modern-mode/launch.sh`

## 📞 Questions?

This is a work in progress! The mode selector is complete and working. The three modes are in various stages of development. Check `distro/SHOWCASE_OS_DESIGN.md` for the full vision and implementation plan.

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0-alpha
**Status**: Mode Selector Complete ✅
