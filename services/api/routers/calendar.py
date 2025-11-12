"""Calendar and events router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Calendar, Event, User
from ..schemas import CalendarCreate, CalendarResponse, EventCreate, EventUpdate, EventResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[CalendarResponse])
def list_calendars(db: Session = Depends(get_db), user: User = Depends(get_default_user)):
    """List all calendars for the user."""
    return db.query(Calendar).filter(Calendar.user_id == user.id).all()


@router.post("", response_model=CalendarResponse)
def create_calendar(
    calendar: CalendarCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new calendar."""
    db_calendar = Calendar(user_id=user.id, **calendar.model_dump())
    db.add(db_calendar)
    db.commit()
    db.refresh(db_calendar)
    return db_calendar


@router.get("/events", response_model=List[EventResponse])
def list_events(
    start: datetime = None,
    end: datetime = None,
    calendar_id: int = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List events with optional filters."""
    query = db.query(Event).join(Calendar).filter(Calendar.user_id == user.id)

    if calendar_id:
        query = query.filter(Event.calendar_id == calendar_id)
    if start:
        query = query.filter(Event.end_ts >= start)
    if end:
        query = query.filter(Event.start_ts <= end)

    return query.order_by(Event.start_ts).all()


@router.post("/events", response_model=EventResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    """Create a new event."""
    db_event = Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get a specific event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/events/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event_data: EventUpdate, db: Session = Depends(get_db)):
    """Update an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for key, value in event_data.model_dump(exclude_unset=True).items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """Delete an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()
    return {"status": "deleted"}
