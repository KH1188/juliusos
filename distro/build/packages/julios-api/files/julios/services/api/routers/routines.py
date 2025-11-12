"""Routines and chores router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Routine, RoutineRun, User
from ..schemas import RoutineCreate, RoutineResponse, RoutineRunCreate, RoutineRunResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[RoutineResponse])
def list_routines(db: Session = Depends(get_db), user: User = Depends(get_default_user)):
    """List all routines for the user."""
    return db.query(Routine).filter(Routine.user_id == user.id).all()


@router.post("", response_model=RoutineResponse)
def create_routine(
    routine: RoutineCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new routine."""
    db_routine = Routine(user_id=user.id, **routine.model_dump())
    db.add(db_routine)
    db.commit()
    db.refresh(db_routine)
    return db_routine


@router.get("/{routine_id}", response_model=RoutineResponse)
def get_routine(routine_id: int, db: Session = Depends(get_db)):
    """Get a specific routine."""
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return routine


@router.put("/{routine_id}", response_model=RoutineResponse)
def update_routine(routine_id: int, routine_data: RoutineCreate, db: Session = Depends(get_db)):
    """Update a routine."""
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    for key, value in routine_data.model_dump(exclude_unset=True).items():
        setattr(routine, key, value)

    db.commit()
    db.refresh(routine)
    return routine


@router.delete("/{routine_id}")
def delete_routine(routine_id: int, db: Session = Depends(get_db)):
    """Delete a routine."""
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    db.delete(routine)
    db.commit()
    return {"status": "deleted"}


# Routine Runs
@router.get("/runs", response_model=List[RoutineRunResponse])
def list_routine_runs(
    routine_id: int = None,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db)
):
    """List routine runs."""
    query = db.query(RoutineRun)

    if routine_id:
        query = query.filter(RoutineRun.routine_id == routine_id)
    if start:
        query = query.filter(RoutineRun.dt >= start)
    if end:
        query = query.filter(RoutineRun.dt <= end)

    return query.order_by(RoutineRun.dt.desc()).all()


@router.post("/runs", response_model=RoutineRunResponse)
def create_routine_run(run: RoutineRunCreate, db: Session = Depends(get_db)):
    """Create a new routine run."""
    db_run = RoutineRun(**run.model_dump())
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run


@router.get("/runs/{run_id}", response_model=RoutineRunResponse)
def get_routine_run(run_id: int, db: Session = Depends(get_db)):
    """Get a specific routine run."""
    run = db.query(RoutineRun).filter(RoutineRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Routine run not found")
    return run


@router.put("/runs/{run_id}", response_model=RoutineRunResponse)
def update_routine_run(run_id: int, run_data: RoutineRunCreate, db: Session = Depends(get_db)):
    """Update a routine run."""
    run = db.query(RoutineRun).filter(RoutineRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Routine run not found")

    for key, value in run_data.model_dump(exclude_unset=True).items():
        setattr(run, key, value)

    db.commit()
    db.refresh(run)
    return run


@router.delete("/runs/{run_id}")
def delete_routine_run(run_id: int, db: Session = Depends(get_db)):
    """Delete a routine run."""
    run = db.query(RoutineRun).filter(RoutineRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Routine run not found")

    db.delete(run)
    db.commit()
    return {"status": "deleted"}
