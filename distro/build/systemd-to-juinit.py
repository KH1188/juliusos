#!/usr/bin/env python3
"""
Convert systemd service files to juinit TOML format
"""

import sys
import re
from pathlib import Path

def parse_systemd_unit(content):
    """Parse systemd unit file into sections"""
    sections = {}
    current_section = None

    for line in content.split('\n'):
        line = line.strip()

        # Skip comments and empty lines
        if not line or line.startswith('#') or line.startswith(';'):
            continue

        # Section header
        if line.startswith('[') and line.endswith(']'):
            current_section = line[1:-1]
            sections[current_section] = {}
            continue

        # Key=Value pair
        if '=' in line and current_section:
            key, value = line.split('=', 1)
            sections[current_section][key.strip()] = value.strip()

    return sections

def convert_to_juinit(sections, service_name):
    """Convert parsed systemd unit to juinit TOML"""
    unit = sections.get('Unit', {})
    service = sections.get('Service', {})
    install = sections.get('Install', {})

    # Basic service info
    toml = f'[service]\n'
    toml += f'name = "{service_name}"\n'
    toml += f'description = "{unit.get("Description", service_name)}"\n'

    # Service type
    service_type = service.get('Type', 'simple').lower()
    type_map = {
        'simple': 'simple',
        'forking': 'forking',
        'oneshot': 'oneshot',
        'notify': 'notify',
        'dbus': 'simple',  # Approximate
        'idle': 'simple'   # Approximate
    }
    toml += f'type = "{type_map.get(service_type, "simple")}"\n\n'

    # Exec section
    toml += '[service.exec]\n'
    toml += f'start = "{service.get("ExecStart", "")}"\n'

    if 'ExecStop' in service:
        toml += f'stop = "{service["ExecStop"]}"\n'
    else:
        toml += 'stop = "/bin/kill -TERM $MAINPID"\n'

    if 'User' in service:
        toml += f'user = "{service["User"]}"\n'

    if 'Group' in service:
        toml += f'group = "{service["Group"]}"\n'

    if 'WorkingDirectory' in service:
        toml += f'working_directory = "{service["WorkingDirectory"]}"\n'

    toml += '\n'

    # Dependencies
    toml += '[service.dependencies]\n'

    after = []
    if 'After' in unit:
        after = [dep.strip() for dep in unit['After'].split()]
    toml += f'after = {after}\n'

    requires = []
    if 'Requires' in unit:
        requires = [dep.strip() for dep in unit['Requires'].split()]
    elif 'Wants' in unit:
        requires = [dep.strip() for dep in unit['Wants'].split()]
    toml += f'requires = {requires}\n'

    toml += '\n'

    # Environment variables
    env_vars = {}
    if 'Environment' in service:
        for env in service['Environment'].split():
            if '=' in env:
                key, value = env.split('=', 1)
                env_vars[key] = value.strip('"')

    if env_vars:
        toml += '[service.environment]\n'
        for key, value in env_vars.items():
            toml += f'{key} = "{value}"\n'
        toml += '\n'

    # Restart policy
    toml += '[service.restart]\n'
    restart = service.get('Restart', 'no').lower()
    restart_map = {
        'no': 'no',
        'always': 'always',
        'on-success': 'on-failure',  # Approximate
        'on-failure': 'on-failure',
        'on-abnormal': 'on-abnormal',
        'on-abort': 'on-abnormal',    # Approximate
        'on-watchdog': 'on-abnormal'  # Approximate
    }
    toml += f'policy = "{restart_map.get(restart, "no")}"\n'

    restart_sec = service.get('RestartSec', '5')
    try:
        # Parse time units (5s, 10min, etc.)
        seconds = int(re.sub(r'[^0-9]', '', restart_sec))
        toml += f'delay_seconds = {seconds}\n'
    except:
        toml += 'delay_seconds = 5\n'

    toml += 'max_retries = 3\n'

    return toml

def main():
    if len(sys.argv) < 2:
        print("Usage: systemd-to-juinit.py <systemd-service-file> [output-file]")
        print("")
        print("Convert systemd service files to juinit TOML format")
        print("")
        print("Example:")
        print("  systemd-to-juinit.py /lib/systemd/system/sshd.service sshd.toml")
        sys.exit(1)

    input_file = Path(sys.argv[1])

    if not input_file.exists():
        print(f"Error: File not found: {input_file}")
        sys.exit(1)

    # Determine output file
    if len(sys.argv) > 2:
        output_file = Path(sys.argv[2])
    else:
        service_name = input_file.stem
        output_file = Path(f"{service_name}.toml")

    # Read systemd unit file
    content = input_file.read_text()

    # Parse it
    sections = parse_systemd_unit(content)

    # Convert to juinit
    service_name = input_file.stem
    toml_content = convert_to_juinit(sections, service_name)

    # Write output
    output_file.write_text(toml_content)

    print(f"✓ Converted {input_file} -> {output_file}")
    print("")
    print("Generated juinit service:")
    print("-" * 60)
    print(toml_content)
    print("-" * 60)
    print("")
    print("Note: This is an approximate conversion. Please review and adjust as needed.")

if __name__ == '__main__':
    main()
