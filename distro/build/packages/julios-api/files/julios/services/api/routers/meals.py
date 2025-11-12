"""Meals router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Meal, User
from ..schemas import MealCreate, MealResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[MealResponse])
def list_meals(
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all meals for the user."""
    query = db.query(Meal).filter(Meal.user_id == user.id)

    if start:
        query = query.filter(Meal.dt >= start)
    if end:
        query = query.filter(Meal.dt <= end)

    return query.order_by(Meal.dt.desc()).all()


@router.post("", response_model=MealResponse)
def create_meal(
    meal: MealCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new meal."""
    db_meal = Meal(user_id=user.id, **meal.model_dump())
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal


@router.get("/{meal_id}", response_model=MealResponse)
def get_meal(meal_id: int, db: Session = Depends(get_db)):
    """Get a specific meal."""
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.put("/{meal_id}", response_model=MealResponse)
def update_meal(meal_id: int, meal_data: MealCreate, db: Session = Depends(get_db)):
    """Update a meal."""
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    for key, value in meal_data.model_dump(exclude_unset=True).items():
        setattr(meal, key, value)

    db.commit()
    db.refresh(meal)
    return meal


@router.delete("/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    """Delete a meal."""
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    db.delete(meal)
    db.commit()
    return {"status": "deleted"}
