"""Goals and vision router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Goal, GoalCheckin, User
from ..schemas import GoalCreate, GoalUpdate, GoalResponse, GoalCheckinCreate, GoalCheckinResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[GoalResponse])
def list_goals(
    horizon: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all goals for the user."""
    query = db.query(Goal).filter(Goal.user_id == user.id)

    if horizon:
        query = query.filter(Goal.horizon == horizon)
    if status:
        query = query.filter(Goal.status == status)

    return query.all()


@router.post("", response_model=GoalResponse)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new goal."""
    db_goal = Goal(user_id=user.id, **goal.model_dump())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: int, db: Session = Depends(get_db)):
    """Get a specific goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: int, goal_data: GoalUpdate, db: Session = Depends(get_db)):
    """Update a goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for key, value in goal_data.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    """Delete a goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"status": "deleted"}


# Goal Check-ins
@router.get("/checkins", response_model=List[GoalCheckinResponse])
def list_goal_checkins(
    goal_id: int = None,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db)
):
    """List goal check-ins."""
    query = db.query(GoalCheckin)

    if goal_id:
        query = query.filter(GoalCheckin.goal_id == goal_id)
    if start:
        query = query.filter(GoalCheckin.dt >= start)
    if end:
        query = query.filter(GoalCheckin.dt <= end)

    return query.order_by(GoalCheckin.dt.desc()).all()


@router.post("/checkins", response_model=GoalCheckinResponse)
def create_goal_checkin(checkin: GoalCheckinCreate, db: Session = Depends(get_db)):
    """Create a new goal check-in."""
    db_checkin = GoalCheckin(**checkin.model_dump())
    db.add(db_checkin)
    db.commit()
    db.refresh(db_checkin)
    return db_checkin


@router.get("/checkins/{checkin_id}", response_model=GoalCheckinResponse)
def get_goal_checkin(checkin_id: int, db: Session = Depends(get_db)):
    """Get a specific goal check-in."""
    checkin = db.query(GoalCheckin).filter(GoalCheckin.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Goal check-in not found")
    return checkin


@router.put("/checkins/{checkin_id}", response_model=GoalCheckinResponse)
def update_goal_checkin(checkin_id: int, checkin_data: GoalCheckinCreate, db: Session = Depends(get_db)):
    """Update a goal check-in."""
    checkin = db.query(GoalCheckin).filter(GoalCheckin.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Goal check-in not found")

    for key, value in checkin_data.model_dump(exclude_unset=True).items():
        setattr(checkin, key, value)

    db.commit()
    db.refresh(checkin)
    return checkin


@router.delete("/checkins/{checkin_id}")
def delete_goal_checkin(checkin_id: int, db: Session = Depends(get_db)):
    """Delete a goal check-in."""
    checkin = db.query(GoalCheckin).filter(GoalCheckin.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Goal check-in not found")

    db.delete(checkin)
    db.commit()
    return {"status": "deleted"}
