#!/usr/bin/env python3
"""
JuliOS Mode Selector
The main launcher interface for choosing between Desktop, Terminal, and Modern modes.
"""

import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gdk, GLib
import subprocess
import json
import os
import sys
from datetime import datetime
from pathlib import Path

class ModeSelectorWindow(Gtk.Window):
    def __init__(self):
        super().__init__(title="JuliOS")

        # Window setup
        self.set_default_size(1000, 700)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_decorated(True)  # Keep decorations for now, can remove for production

        # State
        self.state_file = Path.home() / ".julios" / "state.json"
        self.is_fullscreen = False

        # Apply custom theme
        self.apply_theme()

        # Build UI
        self.build_ui()

        # Track visitor
        self.increment_visitors()

        # Show visitor count
        self.update_visitor_count()

    def apply_theme(self):
        """Apply custom CSS styling for retro-futuristic look."""
        css_provider = Gtk.CssProvider()
        css = b"""
        window {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%);
            background-color: #0a0a0a;
        }

        .title-label {
            color: #f59e0b;
            font-family: 'IBM Plex Mono', 'Courier New', monospace;
            font-size: 64px;
            font-weight: bold;
            text-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
            padding: 20px;
        }

        .subtitle-label {
            color: #8b5cf6;
            font-family: 'IBM Plex Mono', 'Courier New', monospace;
            font-size: 24px;
            padding: 10px;
        }

        .mode-button {
            background: linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%);
            color: #ffffff;
            border: 2px solid #8b5cf6;
            border-radius: 8px;
            padding: 25px 50px;
            font-family: 'IBM Plex Mono', 'Courier New', monospace;
            font-size: 20px;
            font-weight: bold;
            margin: 10px;
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
            transition: all 0.3s ease;
        }

        .mode-button:hover {
            background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
            border-color: #f59e0b;
            box-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
        }

        .mode-button:active {
            background: #4c1d95;
        }

        .description-label {
            color: #9ca3af;
            font-family: 'IBM Plex Mono', 'Courier New', monospace;
            font-size: 14px;
            font-style: italic;
            padding: 5px;
        }

        .footer-label {
            color: #6b7280;
            font-family: 'IBM Plex Mono', 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
        }

        .visitor-label {
            color: #f59e0b;
            font-family: 'IBM Plex Mono', 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            padding: 5px;
        }

        .ascii-label {
            color: #8b5cf6;
            font-family: 'Courier New', monospace;
            font-size: 10px;
        }
        """
        css_provider.load_from_data(css)
        Gtk.StyleContext.add_provider_for_screen(
            Gdk.Screen.get_default(),
            css_provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        )

    def build_ui(self):
        """Build the main user interface."""
        # Main container
        main_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        main_box.set_halign(Gtk.Align.FILL)
        main_box.set_valign(Gtk.Align.FILL)

        # Content container (centered)
        content_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=20)
        content_box.set_halign(Gtk.Align.CENTER)
        content_box.set_valign(Gtk.Align.CENTER)
        content_box.set_margin_top(50)
        content_box.set_margin_bottom(50)

        # ASCII Art Banner
        ascii_art = """
     ██╗██╗   ██╗██╗     ██╗ ██████╗ ███████╗
     ██║██║   ██║██║     ██║██╔═══██╗██╔════╝
     ██║██║   ██║██║     ██║██║   ██║███████╗
██   ██║██║   ██║██║     ██║██║   ██║╚════██║
╚█████╔╝╚██████╔╝███████╗██║╚██████╔╝███████║
 ╚════╝  ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚══════╝
        """
        ascii_label = Gtk.Label(label=ascii_art)
        ascii_label.get_style_context().add_class('ascii-label')
        content_box.pack_start(ascii_label, False, False, 10)

        # Title
        title = Gtk.Label(label="Welcome to JuliOS")
        title.get_style_context().add_class('title-label')
        content_box.pack_start(title, False, False, 0)

        # Subtitle
        subtitle = Gtk.Label(label="Select Your Experience")
        subtitle.get_style_context().add_class('subtitle-label')
        content_box.pack_start(subtitle, False, False, 10)

        # Separator
        separator = Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL)
        separator.set_margin_start(100)
        separator.set_margin_end(100)
        content_box.pack_start(separator, False, False, 20)

        # Mode buttons container
        modes_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=15)

        # Desktop Mode
        desktop_box = self.create_mode_button(
            "🖥️  Desktop Mode",
            "Retro pixel-art GUI with draggable windows",
            "desktop"
        )
        modes_box.pack_start(desktop_box, False, False, 0)

        # Terminal Mode
        terminal_box = self.create_mode_button(
            "💻  Terminal Mode",
            "Command-line portfolio browser",
            "terminal"
        )
        modes_box.pack_start(terminal_box, False, False, 0)

        # Modern Mode
        modern_box = self.create_mode_button(
            "🌐  Modern Mode",
            "Brutalist web-based showcase",
            "modern"
        )
        modes_box.pack_start(modern_box, False, False, 0)

        content_box.pack_start(modes_box, False, False, 20)

        # Visitor counter
        self.visitor_label = Gtk.Label(label="")
        self.visitor_label.get_style_context().add_class('visitor-label')
        content_box.pack_start(self.visitor_label, False, False, 10)

        # Footer
        footer_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=20)
        footer_box.set_halign(Gtk.Align.CENTER)

        footer1 = Gtk.Label(label="Press 1-3 for quick select")
        footer1.get_style_context().add_class('footer-label')
        footer_box.pack_start(footer1, False, False, 0)

        footer2 = Gtk.Label(label="ESC to exit")
        footer2.get_style_context().add_class('footer-label')
        footer_box.pack_start(footer2, False, False, 0)

        footer3 = Gtk.Label(label="F11 for fullscreen")
        footer3.get_style_context().add_class('footer-label')
        footer_box.pack_start(footer3, False, False, 0)

        content_box.pack_start(footer_box, False, False, 20)

        # Add content to main box
        main_box.pack_start(content_box, True, True, 0)

        # Add to window
        self.add(main_box)

        # Keyboard shortcuts
        self.connect("key-press-event", self.on_key_press)

    def create_mode_button(self, label_text, description, mode):
        """Create a mode selection button with description."""
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=5)
        box.set_halign(Gtk.Align.CENTER)

        button = Gtk.Button(label=label_text)
        button.get_style_context().add_class('mode-button')
        button.set_size_request(500, -1)
        button.connect("clicked", self.on_mode_selected, mode)

        desc_label = Gtk.Label(label=description)
        desc_label.get_style_context().add_class('description-label')

        box.pack_start(button, False, False, 0)
        box.pack_start(desc_label, False, False, 0)

        return box

    def on_mode_selected(self, button, mode):
        """Handle mode selection."""
        print(f"🚀 Launching {mode} mode...")

        # Save mode selection
        self.save_mode_selection(mode)

        # Launch the selected mode
        try:
            if mode == "desktop":
                self.launch_desktop_mode()
            elif mode == "terminal":
                self.launch_terminal_mode()
            elif mode == "modern":
                self.launch_modern_mode()
        except Exception as e:
            print(f"❌ Error launching {mode} mode: {e}")
            self.show_error_dialog(f"Failed to launch {mode} mode", str(e))
            return

        # Close mode selector
        # GLib.timeout_add(500, self.close)  # Delay to see the launch

    def launch_desktop_mode(self):
        """Launch Desktop Mode."""
        script = Path("/home/julius/juliusos/opt/julios/desktop-mode/launch.sh")
        if script.exists():
            subprocess.Popen([str(script)])
        else:
            # Placeholder: show message
            self.show_placeholder_dialog("Desktop Mode",
                "Desktop Mode is coming soon!\n\n"
                "This will launch a retro pixel-art GUI with draggable windows,\n"
                "status bars, and a vintage computing aesthetic.")

    def launch_terminal_mode(self):
        """Launch Terminal Mode."""
        jterm = Path("/home/julius/juliusos/opt/julios/terminal-mode/jterm")
        if jterm.exists():
            subprocess.Popen(["alacritty", "-e", str(jterm)])
        else:
            # Placeholder: launch jush in terminal
            jush = Path("/home/julius/juliusos/distro/jush/target/release/jush")
            if jush.exists():
                subprocess.Popen(["x-terminal-emulator", "-e", str(jush)])
            else:
                self.show_placeholder_dialog("Terminal Mode",
                    "Terminal Mode is coming soon!\n\n"
                    "This will launch a custom CLI portfolio browser with\n"
                    "commands like: ls, cat, open, gallery, projects, chat")

    def launch_modern_mode(self):
        """Launch Modern Mode."""
        modern_html = Path("/home/julius/juliusos/opt/julios/modern-mode/index.html")
        if modern_html.exists():
            subprocess.Popen([
                "chromium-browser",
                "--new-window",
                f"file://{modern_html}"
            ])
        else:
            # Placeholder: open existing desktop app
            self.show_placeholder_dialog("Modern Mode",
                "Modern Mode is coming soon!\n\n"
                "This will launch a brutalist web-based portfolio with\n"
                "smooth scrolling, clean typography, and modern design.\n\n"
                "For now, try the existing JuliOS desktop app!")

    def show_placeholder_dialog(self, title, message):
        """Show a placeholder dialog for unimplemented modes."""
        dialog = Gtk.MessageDialog(
            transient_for=self,
            flags=0,
            message_type=Gtk.MessageType.INFO,
            buttons=Gtk.ButtonsType.OK,
            text=title
        )
        dialog.format_secondary_text(message)
        dialog.run()
        dialog.destroy()

    def show_error_dialog(self, title, message):
        """Show an error dialog."""
        dialog = Gtk.MessageDialog(
            transient_for=self,
            flags=0,
            message_type=Gtk.MessageType.ERROR,
            buttons=Gtk.ButtonsType.OK,
            text=title
        )
        dialog.format_secondary_text(message)
        dialog.run()
        dialog.destroy()

    def on_key_press(self, widget, event):
        """Handle keyboard shortcuts."""
        keyval = event.keyval

        if keyval == Gdk.KEY_Escape:
            print("👋 Exiting JuliOS Mode Selector...")
            Gtk.main_quit()
        elif keyval == Gdk.KEY_1:
            self.on_mode_selected(None, "desktop")
        elif keyval == Gdk.KEY_2:
            self.on_mode_selected(None, "terminal")
        elif keyval == Gdk.KEY_3:
            self.on_mode_selected(None, "modern")
        elif keyval == Gdk.KEY_F11:
            if self.is_fullscreen:
                self.unfullscreen()
                self.is_fullscreen = False
            else:
                self.fullscreen()
                self.is_fullscreen = True
        elif keyval == Gdk.KEY_q and (event.state & Gdk.ModifierType.CONTROL_MASK):
            Gtk.main_quit()

    def save_mode_selection(self, mode):
        """Save mode selection to state file."""
        self.state_file.parent.mkdir(parents=True, exist_ok=True)

        try:
            if self.state_file.exists():
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
            else:
                state = {
                    'visitors': 0,
                    'mode_selections': {},
                    'sessions': []
                }
        except Exception as e:
            print(f"Warning: Could not read state file: {e}")
            state = {
                'visitors': 0,
                'mode_selections': {},
                'sessions': []
            }

        # Ensure mode_selections exists
        if 'mode_selections' not in state:
            state['mode_selections'] = {}
        if 'sessions' not in state:
            state['sessions'] = []

        # Update state
        state['last_mode'] = mode
        state['mode_selections'][mode] = state['mode_selections'].get(mode, 0) + 1
        state['sessions'].append({
            'timestamp': datetime.now().isoformat(),
            'mode': mode
        })

        # Keep only last 100 sessions
        if len(state['sessions']) > 100:
            state['sessions'] = state['sessions'][-100:]

        # Save state
        try:
            with open(self.state_file, 'w') as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save state file: {e}")

    def increment_visitors(self):
        """Increment visitor count."""
        self.state_file.parent.mkdir(parents=True, exist_ok=True)

        try:
            if self.state_file.exists():
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
            else:
                state = {'visitors': 0}
        except:
            state = {'visitors': 0}

        state['visitors'] = state.get('visitors', 0) + 1

        try:
            with open(self.state_file, 'w') as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save visitor count: {e}")

    def update_visitor_count(self):
        """Update visitor count display."""
        try:
            if self.state_file.exists():
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
                    visitors = state.get('visitors', 1)
                    self.visitor_label.set_text(f"👥 Visitor #{visitors}")
            else:
                self.visitor_label.set_text("👥 Visitor #1")
        except:
            self.visitor_label.set_text("👥 Welcome!")


def main():
    """Main entry point."""
    print("""
    ╔═══════════════════════════════════════╗
    ║        JuliOS Mode Selector           ║
    ║    Local-First Life Operating System  ║
    ╚═══════════════════════════════════════╝
    """)

    # Check for required dependencies
    try:
        import gi
        gi.require_version('Gtk', '3.0')
    except ImportError:
        print("❌ Error: GTK3 not found. Please install python3-gi")
        sys.exit(1)

    # Create and show window
    win = ModeSelectorWindow()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()

    print("✨ Mode Selector launched!")
    print("   Press 1, 2, or 3 to select a mode")
    print("   Press ESC to exit")
    print("   Press F11 for fullscreen")

    Gtk.main()


if __name__ == "__main__":
    main()
