"""User profile and memory router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import UserProfile, ProfileHistory, MemoryEvent, ValuesJournal, User
from ..schemas import (
    UserProfileUpdate, UserProfileResponse,
    MemoryEventCreate, MemoryEventResponse,
    ValuesJournalCreate, ValuesJournalResponse
)
from .settings import get_default_user

router = APIRouter()


# User Profile
@router.get("", response_model=UserProfileResponse)
def get_user_profile(
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Get user profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        # Create empty profile
        profile = UserProfile(user_id=user.id, profile_json={})
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("", response_model=UserProfileResponse)
def update_user_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Update user profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()

    if not profile:
        profile = UserProfile(user_id=user.id, profile_json=profile_data.profile_json)
        db.add(profile)
    else:
        # Log changes to history
        old_json = profile.profile_json.copy()
        new_json = profile_data.profile_json

        # Find differences and log them
        for key in set(list(old_json.keys()) + list(new_json.keys())):
            old_val = old_json.get(key)
            new_val = new_json.get(key)
            if old_val != new_val:
                history = ProfileHistory(
                    user_id=user.id,
                    key=key,
                    old_json=old_val,
                    new_json=new_val,
                )
                db.add(history)

        profile.profile_json = new_json

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/history", response_model=List[dict])
def get_profile_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Get profile change history."""
    history = (
        db.query(ProfileHistory)
        .filter(ProfileHistory.user_id == user.id)
        .order_by(ProfileHistory.changed_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "key": h.key,
            "old_value": h.old_json,
            "new_value": h.new_json,
            "changed_at": h.changed_at.isoformat(),
        }
        for h in history
    ]


# Memory Events
@router.get("/memory", response_model=List[MemoryEventResponse])
def list_memory_events(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List memory events (Q&A pairs)."""
    return (
        db.query(MemoryEvent)
        .filter(MemoryEvent.user_id == user.id)
        .order_by(MemoryEvent.created_at.desc())
        .limit(limit)
        .all()
    )


@router.post("/memory", response_model=MemoryEventResponse)
def create_memory_event(
    event: MemoryEventCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new memory event."""
    db_event = MemoryEvent(user_id=user.id, **event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


# Values Journal
@router.get("/values", response_model=List[ValuesJournalResponse])
def list_values_journal(
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List values journal entries."""
    return (
        db.query(ValuesJournal)
        .filter(ValuesJournal.user_id == user.id)
        .order_by(ValuesJournal.dt.desc())
        .all()
    )


@router.post("/values", response_model=ValuesJournalResponse)
def create_values_entry(
    entry: ValuesJournalCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new values journal entry."""
    db_entry = ValuesJournal(user_id=user.id, **entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry
