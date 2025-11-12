# JuliOS

A custom Linux distribution with integrated life management, AI assistance, and modern desktop experience.

## Overview

JuliOS is evolving from a desktop productivity application into a full Linux distribution. It combines:
- **Custom system components** (init system, package manager, shell)
- **Life management features** (tasks, habits, health tracking, journaling)
- **AI integration** (local LLM-powered assistant via Ollama)
- **Modern desktop** (Tauri-based UI with React)
- **Debian compatibility** (can run .deb packages)

## Features

- **Planning**: Calendar, tasks, habits with streak tracking
- **Health**: Meal tracking with macros, workout logs, sleep tracking
- **Skills & Projects**: Project management, skill progression, learning sessions
- **Journaling**: Daily entries with mood tracking and templates
- **Bible Study**: Reading plans, reflections, prayer tracking
- **Finances**: Budget tracking, transactions, savings goals
- **Relationships**: Contact management, interaction tracking, birthday reminders
- **Routines**: Templated checklists with cadence tracking
- **Goals**: Multi-horizon goal tracking with check-ins
- **Personal Wiki**: Markdown notes with optional graph view
- **Automations**: Rule-based automations and agent-driven insights

## Project Structure

```
juliusos/
├── apps/
│   └── desktop/          # Tauri desktop application
├── services/
│   ├── api/              # FastAPI backend
│   └── agents/           # AI agent service
├── packages/
│   ├── client/           # TypeScript API client
│   └── ui/               # Shared UI components
├── distro/               # OS distribution components (NEW!)
│   ├── juinit/          # Init system (Rust)
│   ├── jupm/            # Package manager (Rust/Python)
│   ├── jush/            # Shell (Rust)
│   ├── jufsd/           # File system daemon (Rust)
│   ├── build/           # Build system
│   └── docs/            # Documentation
├── infra/
│   ├── migrations/      # Database migrations
│   └── seed/            # Sample data
├── scripts/             # Utility scripts
└── tests/               # Test suites
```

## Architecture

### Current State (Desktop Application)
- Tauri desktop app running on Linux/macOS/Windows
- FastAPI backend with SQLite database
- AI agent service using Ollama
- Local-first architecture

### Target State (Linux Distribution)
- Bootable Linux distro with custom userspace
- Custom system components (juinit, jupm, jush, jufsd)
- JuliOS applications as system services
- Desktop environment with Wayland
- Debian package compatibility

## Core Components

### System Layer (distro/)

#### [juinit](distro/juinit/README.md) - Init System
Lightweight init system written in Rust, replacing systemd.

#### [jupm](distro/jupm/README.md) - Package Manager
Modern package manager with Debian compatibility.

#### [jush](distro/jush/README.md) - Shell
Bash-compatible shell with JuliOS integration.

#### [jufsd](distro/jufsd/README.md) - File System Daemon
Virtual filesystem for JuliOS data.

## Tech Stack

**System Components:**
- Rust (init, package manager, shell, filesystem)
- Linux Kernel 6.x
- Wayland/Wlroots (graphics)

**Application Layer:**
- Python 3.11 + FastAPI (backend)
- TypeScript + React (frontend)
- Tauri (desktop framework)
- SQLite (database)
- Ollama (local LLM)

## Prerequisites

- Linux development machine (Ubuntu/Debian recommended)
- Python 3.11+
- Node.js 18+
- pnpm
- Rust toolchain (1.70+)
- Ollama installed and running
- QEMU (for distribution testing)

## Quick Start

### Desktop Application (Current)

```bash
# Install dependencies
make setup

# Initialize database
make db

# Load sample data (optional)
make seed

# Start development servers
make dev
```

### Building the Distribution (In Progress)

```bash
# Build OS components
make build-distro

# Create bootable ISO
make iso

# Test in VM
make test-vm
```

## Available Commands

**Application:**
- `make setup` - Install all dependencies
- `make db` - Run database migrations
- `make seed` - Load sample data
- `make dev` - Start all services in development mode
- `make test` - Run all tests
- `make package` - Build production app
- `make clean` - Clean build artifacts

**Distribution (Coming Soon):**
- `make build-distro` - Build OS components
- `make iso` - Create bootable ISO
- `make test-vm` - Test in QEMU

## Development Roadmap

See [distro/README.md](distro/README.md) for the complete OS development roadmap.

**Phase 1: Foundation (Months 1-2)** - IN PROGRESS
- Basic juinit implementation
- Minimal root filesystem
- QEMU boot testing

**Phase 2-6: Core utilities, integration, Debian compatibility, and distribution** (Months 3-12)

## Privacy

All data stays local. No cloud accounts, no telemetry, no external calls. Optional file-based sync (e.g., Syncthing) supported.

## Documentation

- [Distribution Overview](distro/README.md)
- [Init System (juinit)](distro/juinit/README.md)
- [Package Manager (jupm)](distro/jupm/README.md)
- [Shell (jush)](distro/jush/README.md)
- [File System Daemon (jufsd)](distro/jufsd/README.md)

## License

TBD
