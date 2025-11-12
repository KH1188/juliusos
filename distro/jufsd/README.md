# jufsd - JuliOS File System Daemon

A virtual file system layer that unifies JuliOS data storage.

## Purpose

jufsd provides a unified interface to JuliOS data by:
- Exposing the SQLite database as a virtual file system
- Providing special `/julios/*` directories
- Managing permissions and ownership
- Integrating with the underlying ext4/btrfs filesystem

## Architecture

```
User Space
    │
    ├── Standard files (/home, /etc, /usr, etc.)
    │   └── ext4/btrfs filesystem
    │
    └── JuliOS files (/julios/*)
        └── jufsd (FUSE-based)
            ├── Database mirror (/julios/db/*)
            ├── Application data (/julios/data/*)
            └── Virtual files (/julios/virtual/*)
```

## Virtual File System Layout

```
/julios/
├── db/                    # Database as files
│   ├── tasks/
│   │   ├── 1.json        # Task ID 1
│   │   ├── 2.json        # Task ID 2
│   │   └── ...
│   ├── habits/
│   ├── meals/
│   ├── journal/
│   └── ...
├── data/                  # Application data
│   ├── julios.db         # SQLite database
│   ├── cache/
│   └── logs/
└── virtual/               # Generated files
    ├── summary.txt       # Daily summary
    ├── stats.json        # Statistics
    └── today.md          # Today's overview
```

## Usage

### Reading Data

```bash
# Read a task as JSON
cat /julios/db/tasks/123.json

# List all habits
ls /julios/db/habits/

# View daily summary
cat /julios/virtual/summary.txt
```

### Writing Data

```bash
# Create a new task
echo '{"title": "New task", "priority": "high"}' > /julios/db/tasks/new.json

# Update a task
jq '.completed = true' /julios/db/tasks/123.json > /tmp/task.json
mv /tmp/task.json /julios/db/tasks/123.json

# Delete a habit
rm /julios/db/habits/45.json
```

### Querying

```bash
# Find all high-priority tasks
grep -r '"priority": "high"' /julios/db/tasks/

# Count completed tasks
ls /julios/db/tasks/ | wc -l

# Get statistics
cat /julios/virtual/stats.json | jq '.tasks.completed'
```

## Integration with SQLite

jufsd maintains a two-way sync:
1. **Read**: SQLite → JSON files in `/julios/db/`
2. **Write**: JSON files → SQLite database

Changes are propagated in near real-time.

## Special Features

### Virtual Files

Some files are generated on-demand:
- `/julios/virtual/summary.txt` - Daily summary
- `/julios/virtual/stats.json` - Current statistics
- `/julios/virtual/today.md` - Today's agenda

### Permissions

Files inherit permissions based on:
- User ownership (single-user system initially)
- Data sensitivity (private by default)
- Service requirements (API needs read/write)

### Caching

jufsd caches frequently accessed data for performance.

## Configuration

Config: `/etc/jufsd/config.toml`

```toml
[database]
path = "/julios/data/julios.db"
connection_pool_size = 10

[filesystem]
mount_point = "/julios"
cache_size_mb = 100
sync_interval_seconds = 5

[permissions]
default_user = "julios"
default_group = "julios"
default_mode = 0600

[virtual_files]
enable = true
update_interval_seconds = 60
```

## Implementation

jufsd is implemented using:
- **FUSE**: Filesystem in Userspace
- **Rust**: For performance and safety
- **SQLite**: As the backing store
- **Tokio**: For async I/O

### Key Components

1. **FUSE Handler**: Handles filesystem operations
2. **Database Sync**: Syncs between SQLite and virtual files
3. **Virtual File Generator**: Creates computed files
4. **Cache Manager**: Manages in-memory cache

## Benefits

1. **Unified Interface**: Access data via filesystem or API
2. **Standard Tools**: Use grep, find, cat, etc. on JuliOS data
3. **Scriptability**: Easy shell scripting
4. **Integration**: Works with existing tools
5. **Performance**: Caching for fast access

## Implementation Status

- [ ] FUSE filesystem skeleton
- [ ] SQLite database reader
- [ ] JSON file generation
- [ ] Write operations (JSON → SQLite)
- [ ] Virtual file generator
- [ ] Caching layer
- [ ] Permission management
- [ ] Configuration loader
- [ ] Inotify for database changes
