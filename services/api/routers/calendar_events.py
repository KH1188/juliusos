"""Calendar events management router for AI agent integration."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os
from pathlib import Path

router = APIRouter()

# Store calendar events in a JSON file
DATA_DIR = Path.home() / ".julios" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
EVENTS_FILE = DATA_DIR / "calendar_events.json"

class CalendarEvent(BaseModel):
    id: int
    date: str  # Format: YYYY-MM-DD
    title: str
    time: Optional[str] = ""

class CalendarEventCreate(BaseModel):
    date: str
    title: str
    time: Optional[str] = ""

def load_events() -> List[dict]:
    """Load events from JSON file."""
    if not EVENTS_FILE.exists():
        return []
    try:
        with open(EVENTS_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_events(events: List[dict]):
    """Save events to JSON file."""
    with open(EVENTS_FILE, 'w') as f:
        json.dump(events, f, indent=2)

@router.get("/events", response_model=List[CalendarEvent])
async def get_all_events(
    date: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None
):
    """
    Get all calendar events, optionally filtered by date/year/month.

    - date: Filter by specific date (YYYY-MM-DD)
    - year: Filter by year
    - month: Filter by month (1-12, requires year)
    """
    events = load_events()

    if date:
        events = [e for e in events if e['date'] == date]
    elif year and month:
        date_prefix = f"{year}-{str(month).zfill(2)}"
        events = [e for e in events if e['date'].startswith(date_prefix)]
    elif year:
        date_prefix = f"{year}"
        events = [e for e in events if e['date'].startswith(date_prefix)]

    # Sort by date
    events.sort(key=lambda e: e['date'])

    return events

@router.get("/events/upcoming")
async def get_upcoming_events(limit: int = 10):
    """Get upcoming events (future and today), sorted by date."""
    events = load_events()
    today = datetime.now().strftime('%Y-%m-%d')

    upcoming = [e for e in events if e['date'] >= today]
    upcoming.sort(key=lambda e: (e['date'], e.get('time', '')))

    return upcoming[:limit]

@router.get("/events/{event_id}", response_model=CalendarEvent)
async def get_event(event_id: int):
    """Get a specific event by ID."""
    events = load_events()
    event = next((e for e in events if e['id'] == event_id), None)

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return event

@router.post("/events", response_model=CalendarEvent)
async def create_event(event: CalendarEventCreate):
    """Create a new calendar event."""
    events = load_events()

    # Generate new ID
    new_id = max([e['id'] for e in events], default=0) + 1

    new_event = {
        'id': new_id,
        'date': event.date,
        'title': event.title,
        'time': event.time or ''
    }

    events.append(new_event)
    save_events(events)

    return new_event

@router.put("/events/{event_id}", response_model=CalendarEvent)
async def update_event(event_id: int, event: CalendarEventCreate):
    """Update an existing event."""
    events = load_events()

    event_index = next((i for i, e in enumerate(events) if e['id'] == event_id), None)
    if event_index is None:
        raise HTTPException(status_code=404, detail="Event not found")

    updated_event = {
        'id': event_id,
        'date': event.date,
        'title': event.title,
        'time': event.time or ''
    }

    events[event_index] = updated_event
    save_events(events)

    return updated_event

@router.delete("/events/{event_id}")
async def delete_event(event_id: int):
    """Delete an event."""
    events = load_events()

    events = [e for e in events if e['id'] != event_id]
    save_events(events)

    return {"success": True, "deleted_id": event_id}

@router.get("/events/date/{date}")
async def get_events_by_date(date: str):
    """Get all events for a specific date (YYYY-MM-DD)."""
    events = load_events()
    date_events = [e for e in events if e['date'] == date]
    date_events.sort(key=lambda e: e.get('time', ''))

    return date_events

@router.post("/sync")
async def sync_with_frontend(events_data: List[CalendarEvent]):
    """
    Sync events from frontend localStorage to backend.
    This allows the desktop app to push its localStorage data to the API.
    """
    events = [e.dict() for e in events_data]
    save_events(events)

    return {"success": True, "synced_count": len(events)}
