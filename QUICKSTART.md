# JuliusOS Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Python 3.11+**
   ```bash
   python3 --version  # Should be 3.11 or higher
   ```

2. **Node.js 18+**
   ```bash
   node --version  # Should be 18 or higher
   ```

3. **Rust** (for Tauri)
   ```bash
   # Install Rust if not present
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

4. **Ollama** (for AI features)
   - Download from: https://ollama.ai
   - Install and start Ollama
   - Pull a model:
     ```bash
     ollama pull llama3:8b
     ```

## Installation

### Option 1: Automated Setup (Recommended)

```bash
cd juliusos
./scripts/setup.sh
```

### Option 2: Manual Setup

```bash
# 1. Install dependencies
make setup

# 2. Initialize database
make db

# 3. Load sample data
make seed
```

## Running JuliusOS

### Start All Services

```bash
make dev
```

This will start:
- API server on http://localhost:8000
- Agent service on http://localhost:8001
- Desktop app (Tauri window)

### Start Services Individually

```bash
# API only
make dev-api

# Agent service only
make dev-agent

# Desktop UI only
make dev-ui
```

## First Time Setup

1. **Check Ollama Status**
   ```bash
   make check-ollama
   ```

2. **Configure Settings**
   - Launch the app
   - Navigate to Settings
   - Verify Ollama URL is correct (default: http://localhost:11434)
   - Select your preferred model

3. **Try the Daily Digest**
   - Go to Dashboard
   - Click "Run Daily Digest"
   - The AI will analyze your data and provide insights

## Key Features to Try

### 1. **Daily Digest** (Dashboard)
AI-powered analysis of your day:
- Prioritized task list
- Calendar conflict detection
- Health summaries
- Bible reading suggestions
- Journaling prompts

### 2. **Task Management** (Plan)
- Drag tasks between todo/doing/done
- Track habits with streaks
- Link tasks to projects

### 3. **Health Tracking** (Health)
- Log meals with macros
- Track workouts and sleep
- Get macro coaching suggestions

### 4. **Bible Study** (Bible)
- Reading plans
- AI-generated reflections
- Prayer tracking

### 5. **Macro Coach** (Health)
Get personalized meal suggestions to hit your macro targets

### 6. **Bible Reflector** (Bible)
Generate reflection questions and prayer points for any passage

## Keyboard Shortcuts

- `N` - Quick add new item
- `/` - Focus search/Ask Assistant
- `Shift+D` - Run daily digest

## Troubleshooting

### Ollama Not Found
```bash
# Make sure Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama
ollama serve
```

### Database Issues
```bash
# Reset database
rm juliusos.db*
make db
make seed
```

### Frontend Build Issues
```bash
# Clear node_modules and reinstall
cd apps/desktop
rm -rf node_modules
pnpm install
```

### API Connection Errors
```bash
# Check if API is running
curl http://localhost:8000/health

# Restart API
make dev-api
```

## Architecture Overview

```
/juliusos
  /apps/desktop          # Tauri + React frontend
  /services/api          # FastAPI REST API
  /services/agents       # Ollama-based AI agents
  /infra/migrations      # Database migrations
  /infra/seed            # Sample data
  /scripts               # Setup scripts
```

## Data Storage

All data is stored locally in `juliusos.db` (SQLite database).

### Backup Your Data

```bash
# Copy the database file
cp juliusos.db juliusos.db.backup

# Or use the built-in export (coming soon)
```

## Development

### Run Tests

```bash
make test           # All tests
make test-api       # API tests only
make test-agents    # Agent tests only
```

### Build Production App

```bash
make package
```

The built app will be in `apps/desktop/src-tauri/target/release/`

## Next Steps

1. **Add Your Data**
   - Start logging tasks, meals, workouts
   - Create habits you want to track
   - Set up a Bible reading plan

2. **Configure Automations**
   - Daily digest at 7:30 AM
   - Journal nudge at 8:00 PM
   - Macro coach prompt if protein is low

3. **Explore Agent Features**
   - Ask questions about your data
   - Run weekly reviews
   - Get schedule rebalancing suggestions

## Getting Help

- Check the main README.md for detailed documentation
- Review code comments for implementation details
- File issues for bugs or feature requests

## Privacy & Security

- ✅ All data stays local
- ✅ No cloud accounts required
- ✅ No telemetry or analytics
- ✅ Ollama runs locally (no API keys needed)

---

**Enjoy your local-first life OS!** 🚀
