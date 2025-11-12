"""Journal entries router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import JournalEntry, User
from ..schemas import JournalEntryCreate, JournalEntryResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[JournalEntryResponse])
def list_journal_entries(
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all journal entries for the user."""
    query = db.query(JournalEntry).filter(JournalEntry.user_id == user.id)

    if start:
        query = query.filter(JournalEntry.dt >= start)
    if end:
        query = query.filter(JournalEntry.dt <= end)

    return query.order_by(JournalEntry.dt.desc()).all()


@router.post("", response_model=JournalEntryResponse)
def create_journal_entry(
    entry: JournalEntryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new journal entry."""
    db_entry = JournalEntry(user_id=user.id, **entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.get("/{entry_id}", response_model=JournalEntryResponse)
def get_journal_entry(entry_id: int, db: Session = Depends(get_db)):
    """Get a specific journal entry."""
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry


@router.put("/{entry_id}", response_model=JournalEntryResponse)
def update_journal_entry(entry_id: int, entry_data: JournalEntryCreate, db: Session = Depends(get_db)):
    """Update a journal entry."""
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    for key, value in entry_data.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
def delete_journal_entry(entry_id: int, db: Session = Depends(get_db)):
    """Delete a journal entry."""
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    db.delete(entry)
    db.commit()
    return {"status": "deleted"}
