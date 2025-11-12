# juinit - JuliOS Init System

A lightweight, modern init system for JuliOS written in Rust.

## Features

- **Service Management**: Start, stop, restart services with dependency resolution
- **Socket Activation**: Services can be started on-demand when sockets are accessed
- **TOML Configuration**: Human-readable service definitions
- **Fast Boot**: Parallel service startup where possible
- **Logging**: Centralized logging for all services
- **Integration**: Deep integration with JuliOS applications

## Architecture

juinit runs as PID 1 and is responsible for:
1. Initializing the system
2. Managing system services
3. Handling service dependencies
4. Monitoring service health
5. Graceful shutdown

## Service Definition Format

Services are defined in TOML files located in `/etc/juinit/services/`:

```toml
[service]
name = "julios-api"
description = "JuliOS API Server"
type = "simple"

[service.exec]
start = "/usr/bin/julios-api"
stop = "/bin/kill -TERM $MAINPID"
user = "julios"
group = "julios"
working_directory = "/julios/services/api"

[service.dependencies]
after = ["network.target", "jufsd.service"]
requires = ["jufsd.service"]

[service.environment]
PYTHONPATH = "/julios/services/api"
JULIOS_ENV = "production"

[service.restart]
policy = "on-failure"
delay_seconds = 5
max_retries = 3
```

## Usage

```bash
# Start a service
juinit start julios-api

# Stop a service
juinit stop julios-api

# Restart a service
juinit restart julios-api

# Check service status
juinit status julios-api

# List all services
juinit list

# Enable service at boot
juinit enable julios-api

# Disable service at boot
juinit disable julios-api

# View service logs
juinit logs julios-api

# Reload configuration
juinit daemon-reload
```

## Default Services

JuliOS includes these default services:

- `jufsd.service` - File system daemon
- `julios-api.service` - API backend
- `julios-agent.service` - AI agent service
- `julios-desktop.service` - Desktop environment
- `network.service` - Network configuration
- `syslog.service` - System logging

## Building

```bash
cd distro/juinit
cargo build --release
```

## Testing

```bash
cargo test
```

## Implementation Status

- [ ] Core daemon (PID 1)
- [ ] Service parser (TOML)
- [ ] Dependency resolver
- [ ] Process spawning and monitoring
- [ ] Socket activation
- [ ] Logging system
- [ ] CLI tool
- [ ] systemd compatibility layer
