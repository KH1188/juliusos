# JuliOS - Custom Linux Distribution

JuliOS is a custom Linux distribution designed to be a Debian-compatible operating system with integrated life management features, AI assistance, and a modern desktop experience.

## Project Vision

Transform JuliOS from a desktop application into a fully-featured Linux distribution that:
- Runs on bare metal hardware
- Provides a complete desktop environment
- Includes custom system components (init, package manager, shell)
- Maintains Debian compatibility for package ecosystem
- Integrates AI-powered productivity features at the OS level

## Architecture

```
┌─────────────────────────────────────────────────────┐
│         JuliOS Applications (Desktop UI)            │
│  (Tasks, Habits, Health, Bible, AI Assistant, etc.) │
├─────────────────────────────────────────────────────┤
│              JuliOS System Services                 │
│   • julios-api (FastAPI backend)                    │
│   • julios-agent (AI service)                       │
│   • julios-desktop (GUI compositor)                 │
├─────────────────────────────────────────────────────┤
│              Core System Components                 │
│   • juinit (Init system)                            │
│   • jupm (Package manager)                          │
│   • jush (Shell)                                    │
│   • jufsd (File system daemon)                      │
├─────────────────────────────────────────────────────┤
│           System Libraries & Runtime                │
│   • glibc, Python runtime, Node.js                  │
│   • Graphics stack (Wayland/Wlroots)                │
├─────────────────────────────────────────────────────┤
│              Linux Kernel 6.x                       │
└─────────────────────────────────────────────────────┘
```

## Core Components

### 1. juinit - Init System
Custom init system written in Rust that replaces systemd. Provides:
- Service management with dependency resolution
- Socket activation
- TOML-based service configuration
- Integration with JuliOS services

**Directory:** `distro/juinit/`

### 2. jupm - Package Manager
JuliOS Package Manager with Debian compatibility. Features:
- Native `.jup` package format
- Dependency resolution
- Repository management
- Debian `.deb` compatibility layer
- Integration with juinit for service management

**Directory:** `distro/jupm/`

### 3. jush - Shell
Bash-compatible shell with JuliOS-specific features:
- Standard shell features (pipes, redirection, job control)
- Built-in commands for JuliOS operations
- Python/JavaScript execution support
- Smart completion and history

**Directory:** `distro/jush/`

### 4. jufsd - File System Daemon
Virtual file system layer providing:
- Unified storage for JuliOS data
- Integration with SQLite database
- Special `/julios/*` directories
- File permissions and ownership

**Directory:** `distro/jufsd/`

### 5. Build System
Custom build system for:
- Cross-compilation toolchain
- Package building
- ISO generation
- Reproducible builds

**Directory:** `distro/build/`

## Directory Structure

```
/
├── boot/                  # Kernel, initramfs, bootloader
├── bin/                   # Essential binaries (jush, jupm, etc.)
├── sbin/                  # System binaries (juinit, jufsd)
├── lib/                   # Shared libraries
├── etc/
│   ├── juinit/           # Init configuration
│   ├── jupm/             # Package manager config
│   └── julios/           # JuliOS app configs
├── julios/               # JuliOS-specific directory
│   ├── apps/             # JuliOS applications
│   ├── data/             # SQLite database, user data
│   ├── services/         # API, agent services
│   └── ui/               # Desktop interface
├── home/                 # User home directories
├── var/
│   ├── log/              # System logs
│   ├── lib/jupm/         # Package database
│   └── lib/julios/       # App data, cache
└── usr/
    ├── bin/              # User binaries
    ├── lib/              # User libraries
    └── share/            # Shared data
```

## Development Roadmap

### Phase 1: Foundation (Months 1-2)
- [x] Set up build environment
- [ ] Implement basic juinit (service start/stop)
- [ ] Create minimal root filesystem
- [ ] Boot test in VM (QEMU)

### Phase 2: Core Utilities (Months 3-4)
- [ ] Build jupm package manager
- [ ] Implement jush shell
- [ ] Create repository structure
- [ ] Package existing dependencies

### Phase 3: System Integration (Months 5-6)
- [ ] Migrate JuliOS API/Agent as system services
- [ ] Build jufsd for unified storage
- [ ] Graphics stack (Wayland compositor)
- [ ] Desktop environment integration

### Phase 4: User Experience (Months 7-8)
- [ ] Boot splash, login manager
- [ ] System settings GUI
- [ ] Desktop UI (port existing Tauri app)
- [ ] Hardware detection and drivers

### Phase 5: Debian Compatibility (Months 9-10)
- [ ] APT compatibility layer
- [ ] .deb package installation
- [ ] systemd service file parser
- [ ] Binary compatibility testing

### Phase 6: Distribution (Months 11-12)
- [ ] ISO generation and installer
- [ ] Documentation and guides
- [ ] Default applications and theming
- [ ] Release JuliOS 1.0

## Getting Started

### Prerequisites
- Linux development machine (Ubuntu/Debian recommended)
- Rust toolchain (1.70+)
- Python 3.11+
- Node.js 18+
- QEMU for testing
- Cross-compilation tools

### Building from Source

```bash
# Install dependencies
make setup

# Build all components
make build-distro

# Create ISO
make iso

# Test in QEMU
make test-vm
```

## Testing

JuliOS can be tested without hardware:
- **QEMU**: Full system emulation
- **Containers**: Test userspace components
- **Chroot**: Test filesystem layout

## Contributing

This is a personal project to learn OS development and create a custom Linux distribution. Contributions and suggestions are welcome!

## License

TBD - To be determined

## Resources

- [Linux From Scratch](https://www.linuxfromscratch.org/)
- [OSDev Wiki](https://wiki.osdev.org/)
- [Debian Policy Manual](https://www.debian.org/doc/debian-policy/)
- [systemd Documentation](https://systemd.io/)
