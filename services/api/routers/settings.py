"""Settings router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Settings, User
from ..schemas import SettingsBase, SettingsResponse

router = APIRouter()


def get_default_user(db: Session = Depends(get_db)) -> User:
    """Get or create default user (single-user system)."""
    user = db.query(User).first()
    if not user:
        user = User(display_name="Julius", timezone="America/Chicago")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db), user: User = Depends(get_default_user)):
    """Get user settings."""
    settings = db.query(Settings).filter(Settings.user_id == user.id).first()
    if not settings:
        settings = Settings(user_id=user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("", response_model=SettingsResponse)
def update_settings(
    settings_data: SettingsBase,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Update user settings."""
    settings = db.query(Settings).filter(Settings.user_id == user.id).first()
    if not settings:
        settings = Settings(user_id=user.id)
        db.add(settings)

    for key, value in settings_data.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)

    db.commit()
    db.refresh(settings)
    return settings
