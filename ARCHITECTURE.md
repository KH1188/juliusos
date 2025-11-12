# JuliusOS Architecture

## System Overview

JuliusOS is a local-first, agentic life operating system that runs entirely offline with Ollama for LLM inference.

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop App (Tauri)                  │
│  React + TypeScript + Zustand + TanStack Query         │
└───────────────┬─────────────────────────────────────────┘
                │ HTTP
                ├──────────────┬────────────────────┐
                │              │                    │
      ┌─────────▼───────┐  ┌──▼────────────┐  ┌───▼──────┐
      │   API Server    │  │ Agent Service │  │  Ollama  │
      │   (FastAPI)     │  │   (FastAPI)   │  │  (Local) │
      └────────┬────────┘  └───────┬───────┘  └──────────┘
               │                   │
          ┌────▼────┐         ┌────▼────────────────┐
          │ SQLite  │         │ Recipes & Tools     │
          │   DB    │         │ - Daily Digest      │
          └─────────┘         │ - Weekly Review     │
                              │ - Bible Reflector   │
                              │ - Macro Coach       │
                              └─────────────────────┘
```

## Components

### 1. Desktop App (`/apps/desktop`)

**Tech Stack:**
- Tauri (Rust-based desktop framework)
- React 18 with TypeScript
- Vite for build tooling
- Zustand for state management
- TanStack Query for data fetching and caching
- Tailwind CSS for styling

**Views:**
- Dashboard: Today's overview with AI-generated digest
- Plan: Task board + habit tracking
- Health: Meal logging, workout tracking, sleep analytics
- Bible: Reading plans, reflections, prayer tracking
- Settings: Configuration and preferences

**Key Features:**
- Optimistic updates for instant UX
- Offline-first with local caching
- Keyboard shortcuts for power users
- Dark/light theme support

### 2. API Server (`/services/api`)

**Tech Stack:**
- FastAPI (Python async web framework)
- SQLAlchemy 2.0 (ORM)
- Alembic (migrations)
- Pydantic (validation)
- SQLite with WAL mode

**Architecture Patterns:**
- Repository pattern for data access
- Dependency injection for DB sessions
- Router-based modular organization
- OpenAPI/Swagger documentation

**API Modules:**
```
/health              → Health check
/settings            → User settings
/calendars           → Calendar management
/calendars/events    → Event CRUD
/tasks               → Task management
/habits              → Habit tracking
/meals               → Meal logging
/workouts            → Workout tracking
/sleep               → Sleep logs
/projects            → Project management
/skills              → Skill tracking
/journal             → Journal entries
/notes               → Personal wiki
/bible/*             → Bible study features
/finances/*          → Budget, transactions, savings
/contacts            → Relationship management
/routines            → Routine tracking
/goals               → Goal management
/automations         → Automation rules
```

### 3. Agent Service (`/services/agents`)

**Tech Stack:**
- FastAPI for HTTP API
- Ollama Python client
- Tenacity for retry logic
- Pydantic for structured outputs

**Core Components:**

**a) Ollama Client (`core/ollama_client.py`)**
- Wrapper around Ollama HTTP API
- Automatic retry with exponential backoff
- Fallback model support
- JSON mode for structured outputs
- Temperature control for creative vs. factual responses

**b) Context Builder (`core/context_builder.py`)**
- Aggregates user data from API
- Configurable time windows (default: 7 days)
- Module-based filtering
- Macro calculations and summaries
- Upcoming birthday detection

**c) Recipes (`recipes/`)**

Each recipe is a self-contained AI workflow:

1. **Daily Digest** (`daily_digest.py`)
   - Analyzes tasks, events, health data
   - Returns prioritized plan, conflicts, focus blocks
   - Health summary and Bible suggestions
   - Journaling prompt

2. **Weekly Review** (`weekly_review.py`)
   - Aggregates 7-day metrics
   - Identifies wins and improvements
   - Goal progress check-ins
   - Habit consistency analysis

3. **Bible Reflector** (`bible_reflector.py`)
   - Generates reflection questions
   - Creates prayer points
   - Considers recent reading context

4. **Macro Coach** (`macro_coach.py`)
   - Calculates protein gaps
   - Suggests quick meals to close gaps
   - Includes macro estimates

5. **Schedule Rebalancer** (`schedule_rebalancer.py`)
   - Analyzes calendar conflicts
   - Proposes non-overlapping time blocks
   - Prioritizes high-value tasks

**Prompt Engineering:**
- Templates in `/prompts/*.txt`
- Mustache-style variable substitution
- System prompts enforce JSON output
- Chain-of-thought hidden from user

### 4. Database (`juliusos.db`)

**Schema Highlights:**

```sql
-- Core
users, settings

-- Planning
calendars, events, tasks, habits, habit_logs

-- Health
meals, workouts, sleep_logs

-- Knowledge
journal_entries, notes, note_links

-- Bible
bible_plans, bible_readings, bible_reflections, prayer_items

-- Finance
budgets, transactions, savings_goals

-- Social
contacts, interactions

-- Goals
projects, skills, learning_sessions, goals, goal_checkins

-- Automations
automation_rules, automation_logs
```

**Performance:**
- WAL mode for concurrent reads/writes
- Composite indexes on (user_id, dt) for timeline queries
- Foreign key constraints enforced
- JSON columns for flexible schema

### 5. Automation Engine (`services/api/automations.py`)

**Tech Stack:**
- APScheduler (background job scheduler)
- Cron triggers for time-based rules
- Condition evaluation engine

**Example Rules:**

```json
{
  "name": "Daily Digest",
  "trigger": {"type": "cron", "cron": "30 7 * * *"},
  "condition": {"type": "always"},
  "action": {
    "type": "run_agent_recipe",
    "name": "daily_digest",
    "save_to": "notes"
  }
}
```

**Condition Types:**
- `always`: Always execute
- `journal_absent`: Check if no journal entry today
- `protein_gap_gt`: Check if protein gap exceeds threshold

**Action Types:**
- `run_agent_recipe`: Execute an AI recipe
- `notify_ui`: Send notification to user

### 6. Migrations (`/infra/migrations`)

**Alembic Configuration:**
- Auto-generate migrations from model changes
- Version control for schema evolution
- Rollback support

**Usage:**
```bash
# Create migration
alembic revision --autogenerate -m "add new table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Data Flow

### 1. User Action → API → Database

```
User clicks "Add Task"
  → React component calls API client
  → TanStack Query mutation
  → HTTP POST /tasks
  → FastAPI router
  → SQLAlchemy insert
  → Database commit
  → Response back to UI
  → Optimistic update applied
```

### 2. Agent Recipe Execution

```
User clicks "Run Daily Digest"
  → API call to /agent/digest/daily
  → Main API proxies to Agent Service
  → Context Builder fetches last 7 days
  → Prompt template populated
  → Ollama generates JSON response
  → Recipe parses and validates
  → Result returned to UI
  → Dashboard displays digest
```

### 3. Automation Rule Execution

```
Scheduler fires at 7:30 AM
  → Automation engine checks conditions
  → Condition: journal_absent → true
  → Execute action: notify_ui
  → Log execution in automation_logs
  → Update rule last_run_ts
```

## Security & Privacy

### Local-First Principles
- All data stored in local SQLite
- No cloud accounts or API keys (except local Ollama)
- No telemetry or analytics
- Optional privacy lock (PIN-based)

### Network Security
- API only listens on localhost
- CORS restricted to Tauri origins
- No external HTTP calls (except localhost Ollama)

### Data Integrity
- Foreign key constraints
- Transaction-based writes
- WAL mode for durability
- Regular backups recommended

## Performance Optimizations

### Frontend
- Code splitting with React.lazy
- TanStack Query caching (5min stale time)
- Optimistic updates for instant UX
- Virtualized lists for long datasets

### Backend
- Connection pooling with SQLAlchemy
- Indexed queries on hot paths
- Batch inserts where possible
- Async handlers with FastAPI

### Agent Service
- Context window limiting (7 days default)
- JSON mode for faster parsing
- Retry with exponential backoff
- Fallback model for reliability

## Deployment

### Development
```bash
make dev
```

### Production Build
```bash
make package
```

Produces standalone executable in:
```
apps/desktop/src-tauri/target/release/
```

### Cross-Platform
- Linux: AppImage, deb, rpm
- macOS: .app bundle, DMG
- Windows: MSI installer

## Extension Points

### Adding New Modules
1. Create SQLAlchemy model in `models.py`
2. Create router in `routers/`
3. Add CRUD endpoints
4. Create React views
5. Add navigation link
6. Generate migration

### Adding New Recipes
1. Create prompt template in `prompts/`
2. Implement recipe in `recipes/`
3. Register in agent main.py
4. Add UI trigger button
5. Test with sample data

### Adding New Automations
1. Define trigger (cron, event)
2. Create condition checker
3. Implement action handler
4. Add via UI or seed data

## Testing Strategy

### API Tests
- Unit tests for CRUD operations
- Validation edge cases
- Error handling

### Agent Tests
- Mock Ollama client
- Golden file tests for recipes
- Context builder validation

### E2E Tests (Playwright)
- First-run experience
- Daily digest flow
- Habit logging with streak
- Bible reflection generation
- Macro coach suggestions

## Monitoring & Debugging

### Logs
- API: Console output (INFO level)
- Agent: Console output (INFO level)
- Automation: APScheduler logs

### Health Checks
- `GET /health` - API status
- `GET /agent/health` - Agent + Ollama status
- `make check-ollama` - Verify Ollama connection

### Dev Console
- Optional panel in UI to inspect last agent JSON output
- Useful for debugging prompts

## Future Enhancements

### Planned Features
- Vector search for semantic note queries (sqlite-vss)
- Export all data to JSON/CSV/Markdown
- Backup/restore with compression
- Mobile companion (React Native + Tauri sync)
- Voice input for journaling
- Calendar sync (CalDAV)
- Habit analytics dashboard

### Architecture Improvements
- GraphQL alternative to REST
- WebSocket for real-time updates
- Background sync worker
- Plugin system for community extensions

---

This architecture provides a solid foundation for a local-first, AI-powered life OS that respects user privacy and runs entirely offline.
