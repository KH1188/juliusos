"""Sleep logs router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import SleepLog, User
from ..schemas import SleepLogCreate, SleepLogResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[SleepLogResponse])
def list_sleep_logs(
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all sleep logs for the user."""
    query = db.query(SleepLog).filter(SleepLog.user_id == user.id)

    if start:
        query = query.filter(SleepLog.date >= start)
    if end:
        query = query.filter(SleepLog.date <= end)

    return query.order_by(SleepLog.date.desc()).all()


@router.post("", response_model=SleepLogResponse)
def create_sleep_log(
    sleep_log: SleepLogCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new sleep log."""
    db_sleep_log = SleepLog(user_id=user.id, **sleep_log.model_dump())
    db.add(db_sleep_log)
    db.commit()
    db.refresh(db_sleep_log)
    return db_sleep_log


@router.get("/{sleep_log_id}", response_model=SleepLogResponse)
def get_sleep_log(sleep_log_id: int, db: Session = Depends(get_db)):
    """Get a specific sleep log."""
    sleep_log = db.query(SleepLog).filter(SleepLog.id == sleep_log_id).first()
    if not sleep_log:
        raise HTTPException(status_code=404, detail="Sleep log not found")
    return sleep_log


@router.put("/{sleep_log_id}", response_model=SleepLogResponse)
def update_sleep_log(sleep_log_id: int, sleep_log_data: SleepLogCreate, db: Session = Depends(get_db)):
    """Update a sleep log."""
    sleep_log = db.query(SleepLog).filter(SleepLog.id == sleep_log_id).first()
    if not sleep_log:
        raise HTTPException(status_code=404, detail="Sleep log not found")

    for key, value in sleep_log_data.model_dump(exclude_unset=True).items():
        setattr(sleep_log, key, value)

    db.commit()
    db.refresh(sleep_log)
    return sleep_log


@router.delete("/{sleep_log_id}")
def delete_sleep_log(sleep_log_id: int, db: Session = Depends(get_db)):
    """Delete a sleep log."""
    sleep_log = db.query(SleepLog).filter(SleepLog.id == sleep_log_id).first()
    if not sleep_log:
        raise HTTPException(status_code=404, detail="Sleep log not found")

    db.delete(sleep_log)
    db.commit()
    return {"status": "deleted"}
