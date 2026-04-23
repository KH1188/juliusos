# JuliOS Mode Selector

The main entry point for the JuliOS showcase operating system.

## Features

- **Visual Design**: Retro-futuristic aesthetic with deep blacks, purples, and golds
- **Three Modes**: Desktop (retro GUI), Terminal (CLI), Modern (web)
- **Visitor Tracking**: Counts and tracks visitor sessions
- **Keyboard Shortcuts**: Quick access with number keys (1-3)
- **Fullscreen Support**: F11 to toggle fullscreen mode

## Usage

### Launch Mode Selector

```bash
# From anywhere
/home/julius/juliusos/opt/julios/bin/julios

# Or directly
python3 /home/julius/juliusos/opt/julios/mode-selector/mode-selector.py
```

### Keyboard Shortcuts

- **1** - Launch Desktop Mode
- **2** - Launch Terminal Mode
- **3** - Launch Modern Mode
- **F11** - Toggle fullscreen
- **ESC** - Exit mode selector
- **Ctrl+Q** - Quit

## State Management

The mode selector tracks:
- Total visitor count
- Mode selection preferences
- Session history (last 100 sessions)

State is stored in: `~/.julios/state.json`

## Dependencies

- Python 3.6+
- GTK 3
- python3-gi (PyGObject)

### Install Dependencies (Ubuntu/Debian)

```bash
sudo apt install python3 python3-gi gir1.2-gtk-3.0
```

## Architecture

```
mode-selector.py
├── ModeSelectorWindow (GTK Window)
│   ├── UI Components
│   │   ├── ASCII art banner
│   │   ├── Title and subtitle
│   │   ├── Three mode buttons
│   │   ├── Visitor counter
│   │   └── Footer with shortcuts
│   │
│   ├── Event Handlers
│   │   ├── Button clicks
│   │   ├── Keyboard shortcuts
│   │   └── Window events
│   │
│   └── State Management
│       ├── Save mode selections
│       ├── Track visitors
│       └── Session history
│
└── Launch Functions
    ├── launch_desktop_mode()
    ├── launch_terminal_mode()
    └── launch_modern_mode()
```

## Customization

### Theme Colors

Edit the CSS in `apply_theme()`:

```python
.title-label {
    color: #f59e0b;  # Gold
}
.mode-button {
    background: #6d28d9;  # Purple
    border: 2px solid #8b5cf6;  # Light purple
}
```

### Mode Launchers

Edit launch functions to customize what happens when each mode is selected:

- `launch_desktop_mode()` - Desktop Mode launcher
- `launch_terminal_mode()` - Terminal Mode launcher
- `launch_modern_mode()` - Modern Mode launcher

## Development

### Test Mode Selector

```bash
cd /home/julius/juliusos/opt/julios/mode-selector
python3 mode-selector.py
```

### Debug Output

The mode selector prints status messages to stdout:
- Launch events
- Mode selections
- Error messages

### State File Format

```json
{
  "visitors": 42,
  "last_mode": "terminal",
  "mode_selections": {
    "desktop": 15,
    "terminal": 20,
    "modern": 7
  },
  "sessions": [
    {
      "timestamp": "2025-11-12T08:30:00",
      "mode": "terminal"
    }
  ]
}
```

## Integration with Boot System

When JuliOS boots, the mode selector is launched automatically by `.xinitrc`:

```bash
# ~/.xinitrc
/opt/julios/bin/julios
```

## Future Enhancements

- [ ] Animated transitions between selections
- [ ] Preview thumbnails for each mode
- [ ] Recent mode quick access
- [ ] Custom themes (dark/light/retro)
- [ ] Sound effects (optional)
- [ ] Network status indicator
- [ ] System resource display (CPU, RAM, disk)
- [ ] Weather widget
- [ ] Music player controls
