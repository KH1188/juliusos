# AI Agent Integration with Desktop Apps

## Overview

This guide explains how the AI agent can understand and interact with your JuliOS desktop applications (Calendar, Email, Files, etc.).

## Architecture

```
┌─────────────────────┐
│   Desktop Apps      │
│  (Browser/Frontend) │
│                     │
│ - Calendar          │
│ - Email             │
│ - File Manager      │
│ - etc.              │
└──────────┬──────────┘
           │
           │ HTTP/REST API
           ▼
┌─────────────────────┐
│   FastAPI Backend   │
│   (Port 8000)       │
│                     │
│ /calendar-events/*  │
│ /emails/*           │
│ /files/*            │
│ /terminal/*         │
└──────────┬──────────┘
           │
           │ Python Tools
           ▼
┌─────────────────────┐
│   AI Agent          │
│  (Port 8001)        │
│                     │
│ - desktop_tools.py  │
│ - Uses API          │
└─────────────────────┘
```

## How It Works

### 1. **Data Storage**

Desktop apps can store data in two places:

- **Browser localStorage**: Quick, immediate (but AI can't access)
- **API Backend (JSON files)**: Persistent, AI-accessible

Files are stored in:
```
~/.julios/data/
├── calendar_events.json
├── emails.json
└── (future: tasks.json, notes.json, etc.)
```

### 2. **API Endpoints**

The AI agent calls these HTTP endpoints to interact with apps:

#### Calendar Events API
```
GET    /calendar-events/events              # Get all events
GET    /calendar-events/events/upcoming     # Get upcoming events
GET    /calendar-events/events/{id}         # Get specific event
POST   /calendar-events/events              # Create event
PUT    /calendar-events/events/{id}         # Update event
DELETE /calendar-events/events/{id}         # Delete event
POST   /calendar-events/sync                # Sync from frontend
```

#### Emails API
```
GET    /emails/emails                       # Get all emails
GET    /emails/emails/inbox/unread          # Get unread inbox
GET    /emails/emails/{id}                  # Get specific email
POST   /emails/emails                       # Send/create email
PATCH  /emails/emails/{id}                  # Update email (read/star/folder)
DELETE /emails/emails/{id}                  # Delete email
GET    /emails/emails/stats                 # Get email statistics
POST   /emails/sync                         # Sync from frontend
```

#### Files API
```
GET    /files/list                          # List directory
GET    /files/read                          # Read file
POST   /files/write                         # Write file
POST   /files/create-folder                 # Create folder
POST   /files/delete                        # Delete file/folder
```

#### Terminal API
```
POST   /terminal/execute                    # Execute command
```

### 3. **AI Agent Tools**

The AI agent has Python functions in `desktop_tools.py` that wrap these API calls:

```python
# Calendar
get_calendar_events(date=None, year=None, month=None)
get_upcoming_events(limit=10)
create_calendar_event(date, title, time="")
delete_calendar_event(event_id)

# Email
get_emails(folder=None, unread=None, search=None)
get_unread_inbox()
send_email(to, subject, body)
mark_email_as_read(email_id)
star_email(email_id)
delete_email(email_id, permanent=False)
get_email_stats()

# Files
list_files(path)
read_file(path)
write_file(path, content)

# Terminal
execute_command(command, cwd=None)
```

## Example Conversations with AI

### Example 1: Calendar Queries

**User**: "What events do I have this week?"

**AI Agent**:
```python
import desktop_tools
from datetime import datetime, timedelta

# Get upcoming events
events = desktop_tools.get_upcoming_events(limit=20)

# Filter for this week
today = datetime.now()
week_end = today + timedelta(days=7)

this_week = [e for e in events
             if today.strftime('%Y-%m-%d') <= e['date'] <= week_end.strftime('%Y-%m-%d')]

# Response
"You have 3 events this week:
1. Team Meeting on 2025-11-13 at 10:00 AM
2. Doctor Appointment on 2025-11-15 at 2:00 PM
3. Project Deadline on 2025-11-18"
```

### Example 2: Creating Events

**User**: "Add a reminder for my dentist appointment next Monday at 3pm"

**AI Agent**:
```python
import desktop_tools
from datetime import datetime, timedelta

# Calculate next Monday
today = datetime.now()
days_until_monday = (7 - today.weekday()) % 7
next_monday = today + timedelta(days=days_until_monday)

# Create event
event = desktop_tools.create_calendar_event(
    date=next_monday.strftime('%Y-%m-%d'),
    title="Dentist Appointment",
    time="3:00 PM"
)

# Response
"I've added your dentist appointment for Monday, November 18, 2025 at 3:00 PM"
```

### Example 3: Email Management

**User**: "Do I have any unread emails?"

**AI Agent**:
```python
import desktop_tools

# Check unread
unread = desktop_tools.get_unread_inbox()

if unread['count'] > 0:
    # Show summaries
    summaries = []
    for email in unread['emails'][:5]:  # Top 5
        summaries.append(f"- {email['subject']} from {email['from_addr']}")

    # Response
    f"You have {unread['count']} unread emails:\n" + "\n".join(summaries)
else:
    "No unread emails - inbox zero!"
```

### Example 4: File Operations

**User**: "What files are in my Documents folder?"

**AI Agent**:
```python
import desktop_tools

# List files
files = desktop_tools.list_files(path="/home/julius/Documents")

# Format response
file_list = []
for f in files['files'][:10]:  # Top 10
    file_list.append(f"{f['type'].upper()}: {f['name']} ({f['size']})")

# Response
f"Found {len(files['files'])} items in Documents:\n" + "\n".join(file_list)
```

## Syncing Desktop Apps with API

Currently, desktop apps use **localStorage**. To make them work with the AI, they can sync with the API:

### Option 1: On-Demand Sync (Recommended for Now)

Desktop apps keep using localStorage, but provide a "Sync" button:

```javascript
// In calendar app
async function syncToBackend() {
    const events = JSON.parse(localStorage.getItem('julios_calendar_events') || '[]');

    await fetch('http://localhost:8000/calendar-events/sync', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(events)
    });

    alert('Calendar synced with AI!');
}
```

### Option 2: Automatic Background Sync

Desktop apps can sync every time data changes:

```javascript
// In calendar app
async function addEvent(year, month, day, title, time) {
    // Save to localStorage (current)
    const events = loadEvents();
    events.push({id: Date.now(), date: dateStr, title, time});
    saveEvents(events);

    // Also sync to backend (new)
    await fetch('http://localhost:8000/calendar-events/events', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({date: dateStr, title, time})
    });

    renderCalendar();
}
```

### Option 3: Use API as Primary Storage

Desktop apps call the API directly instead of localStorage:

```javascript
// Load events from API
async function loadEvents() {
    const response = await fetch('http://localhost:8000/calendar-events/events');
    return await response.json();
}

// Save event to API
async function addEvent(year, month, day, title, time) {
    const response = await fetch('http://localhost:8000/calendar-events/events', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({date: dateStr, title, time})
    });

    const newEvent = await response.json();
    renderCalendar();
}
```

## Testing the Integration

### 1. Test Calendar Events API

```bash
# Create an event
curl -X POST http://localhost:8000/calendar-events/events \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-25", "title": "Christmas", "time": "10:00 AM"}'

# Get all events
curl http://localhost:8000/calendar-events/events

# Get upcoming events
curl http://localhost:8000/calendar-events/events/upcoming
```

### 2. Test Email API

```bash
# Send an email
curl -X POST http://localhost:8000/emails/emails \
  -H "Content-Type: application/json" \
  -d '{"to_addr": "friend@julios.local", "subject": "Hello", "body": "Test message"}'

# Get inbox
curl "http://localhost:8000/emails/emails?folder=inbox"

# Get unread
curl http://localhost:8000/emails/emails/inbox/unread
```

### 3. Test AI Tools

```bash
cd /home/julius/juliusos/services/agents
python3 desktop_tools.py
```

## Next Steps

1. **Add Sync Buttons**: Add "Sync with AI" buttons to Calendar and Email apps
2. **More Tools**: Create APIs for Tasks, Notes, Habits, etc.
3. **Agent Integration**: Update the AI agent to automatically use these tools
4. **Real-time Updates**: Use WebSockets for live sync between desktop and AI
5. **Voice Commands**: "Hey JuliOS, what's on my calendar today?"

## FAQ

**Q: Will my data be sent to the cloud?**
A: No! Everything is local. The API runs on localhost (your computer). Data is stored in `~/.julios/data/` on your machine.

**Q: Can the AI modify my files?**
A: Only through the APIs you've enabled. The AI uses the same file access restrictions as the desktop apps (limited to `/home/julius` and `/home/julius/juliusos`).

**Q: Do desktop apps work without the AI?**
A: Yes! Desktop apps work independently using localStorage. The API is optional for AI integration.

**Q: How do I add more apps?**
A: Create a new router in `/services/api/routers/`, add endpoints, create tools in `desktop_tools.py`, and register the router in `main.py`.

## Summary

You now have:

✅ **Calendar Events API** - AI can read/create/delete calendar events
✅ **Email API** - AI can read/send/manage emails
✅ **File API** - AI can browse/read/write files
✅ **Terminal API** - AI can execute commands
✅ **Python Tools** - AI agent has pre-built functions to use all of these

The AI can now understand:
- "What's on my calendar tomorrow?"
- "Do I have any unread emails?"
- "Create a reminder for Monday at 3pm"
- "What files are in my Documents folder?"
- "Send an email to remind me about the meeting"

All of this runs locally on your machine!
