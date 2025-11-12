"""Workouts router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Workout, User
from ..schemas import WorkoutCreate, WorkoutResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[WorkoutResponse])
def list_workouts(
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all workouts for the user."""
    query = db.query(Workout).filter(Workout.user_id == user.id)

    if start:
        query = query.filter(Workout.dt >= start)
    if end:
        query = query.filter(Workout.dt <= end)

    return query.order_by(Workout.dt.desc()).all()


@router.post("", response_model=WorkoutResponse)
def create_workout(
    workout: WorkoutCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new workout."""
    db_workout = Workout(user_id=user.id, **workout.model_dump())
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout)
    return db_workout


@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_workout(workout_id: int, db: Session = Depends(get_db)):
    """Get a specific workout."""
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


@router.put("/{workout_id}", response_model=WorkoutResponse)
def update_workout(workout_id: int, workout_data: WorkoutCreate, db: Session = Depends(get_db)):
    """Update a workout."""
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    for key, value in workout_data.model_dump(exclude_unset=True).items():
        setattr(workout, key, value)

    db.commit()
    db.refresh(workout)
    return workout


@router.delete("/{workout_id}")
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    """Delete a workout."""
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    db.delete(workout)
    db.commit()
    return {"status": "deleted"}
