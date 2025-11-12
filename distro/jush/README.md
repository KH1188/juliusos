# jush - JuliOS Shell

A modern, Bash-compatible shell with JuliOS integration.

## Features

- **Bash Compatible**: Runs most Bash scripts
- **Modern Syntax**: Additional features beyond Bash
- **JuliOS Integration**: Built-in commands for JuliOS operations
- **Smart Completion**: Context-aware tab completion
- **History**: Persistent command history with search
- **Scripting**: Supports both shell and Python/JS scripts
- **Performance**: Fast startup and execution

## Architecture

```
jush
├── Parser (Rust)
│   ├── Lexer
│   ├── AST builder
│   └── Syntax validator
├── Executor
│   ├── Built-in commands
│   ├── External commands
│   ├── Pipelines
│   └── Redirections
├── Completion Engine
│   ├── Command completion
│   ├── Path completion
│   └── JuliOS-specific completion
└── REPL
    ├── Line editor (rustyline)
    ├── History
    └── Prompt customization
```

## Basic Usage

### Standard Shell Features

```bash
# Commands and pipes
ls -la | grep julios

# Redirections
echo "hello" > file.txt
cat < input.txt

# Variables
name="JuliOS"
echo "Welcome to $name"

# Conditionals
if [ -f /etc/julios.conf ]; then
    echo "Config found"
fi

# Loops
for file in *.txt; do
    cat "$file"
done

# Functions
hello() {
    echo "Hello, $1!"
}
hello World
```

### JuliOS-Specific Features

```bash
# Manage tasks
task add "Complete project" --due tomorrow
task list --today
task complete 123

# View habits
habit streak meditation
habit log exercise --value 30min

# Check health
health summary --week
health meals --today

# AI assistant
ask "What should I focus on today?"
digest daily

# System info
julios version
julios status
julios update
```

### Built-in Commands

Standard:
- `cd`, `pwd`, `echo`, `export`, `source`, `alias`
- `exit`, `help`, `history`, `jobs`, `fg`, `bg`

JuliOS-specific:
- `task` - Task management
- `habit` - Habit tracking
- `health` - Health metrics
- `journal` - Journal entries
- `note` - Note taking
- `ask` - AI assistant
- `digest` - Daily digest
- `julios` - System operations

## Configuration

Config file: `~/.jushrc`

```bash
# Prompt customization
PROMPT="%u@%h:%w$ "

# Aliases
alias ll="ls -la"
alias gs="git status"

# Environment
export EDITOR=vim
export PATH=$PATH:/julios/bin

# JuliOS integration
export JULIOS_API_URL="http://localhost:8000"

# History
HISTSIZE=10000
HISTFILE=~/.jush_history

# Completion
set completion-ignore-case on
```

## Scripting

### Shell Scripts

```bash
#!/usr/bin/jush

# Get today's tasks
tasks=$(task list --today --format json)

# Process with jq
echo "$tasks" | jq '.[] | .title'

# Use JuliOS features
ask "Summarize my day: $tasks"
```

### Python Integration

```bash
#!/usr/bin/jush

# Run Python inline
python <<EOF
import requests
resp = requests.get("http://localhost:8000/api/tasks")
print(resp.json())
EOF
```

### JavaScript Integration

```bash
#!/usr/bin/jush

# Run JavaScript inline
node -e "
const tasks = require('./tasks.json');
console.log(tasks.filter(t => t.priority === 'high'));
"
```

## Advanced Features

### Smart Completion

```bash
# Command completion
ta<TAB>       # Completes to 'task'

# Path completion
cd /jul<TAB>  # Completes to '/julios/'

# Context-aware
task comp<TAB> # Shows task IDs for completion
```

### History Search

```bash
# Reverse search
Ctrl+R

# History with filters
history | grep git

# Re-run command
!123        # Run command #123
!!          # Run last command
!task       # Run last 'task' command
```

### Job Control

```bash
# Background jobs
julios-api &
jobs

# Bring to foreground
fg %1

# Suspend
Ctrl+Z
bg
```

## Implementation Status

- [ ] Lexer/Parser (Bash-compatible)
- [ ] Command executor
- [ ] Built-in commands (standard)
- [ ] Built-in commands (JuliOS)
- [ ] Pipelines and redirections
- [ ] Variables and expansion
- [ ] Control flow (if/for/while)
- [ ] Functions
- [ ] Job control
- [ ] Tab completion
- [ ] History
- [ ] Configuration (.jushrc)
- [ ] Python/JS integration
