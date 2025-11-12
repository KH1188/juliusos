"""Habits router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Habit, HabitLog, User
from ..schemas import HabitCreate, HabitResponse, HabitLogCreate, HabitLogResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[HabitResponse])
def list_habits(
    is_active: bool = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all habits for the user."""
    query = db.query(Habit).filter(Habit.user_id == user.id)

    if is_active is not None:
        query = query.filter(Habit.is_active == is_active)

    return query.all()


@router.post("", response_model=HabitResponse)
def create_habit(
    habit: HabitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new habit."""
    db_habit = Habit(user_id=user.id, **habit.model_dump())
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit


@router.get("/{habit_id}", response_model=HabitResponse)
def get_habit(habit_id: int, db: Session = Depends(get_db)):
    """Get a specific habit."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: int, habit_data: HabitCreate, db: Session = Depends(get_db)):
    """Update a habit."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    for key, value in habit_data.model_dump(exclude_unset=True).items():
        setattr(habit, key, value)

    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    """Delete a habit."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    db.delete(habit)
    db.commit()
    return {"status": "deleted"}


@router.post("/{habit_id}/log", response_model=HabitLogResponse)
def log_habit(habit_id: int, log: HabitLogCreate, db: Session = Depends(get_db)):
    """Log a habit completion."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    db_log = HabitLog(habit_id=habit_id, **log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/{habit_id}/logs", response_model=List[HabitLogResponse])
def get_habit_logs(
    habit_id: int,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db)
):
    """Get logs for a habit."""
    query = db.query(HabitLog).filter(HabitLog.habit_id == habit_id)

    if start:
        query = query.filter(HabitLog.date >= start)
    if end:
        query = query.filter(HabitLog.date <= end)

    return query.order_by(HabitLog.date.desc()).all()
