"""Bible study router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import BiblePlan, BibleReading, BibleReflection, PrayerItem, User
from ..schemas import (
    BiblePlanCreate, BiblePlanResponse,
    BibleReadingCreate, BibleReadingResponse,
    BibleReflectionCreate, BibleReflectionResponse,
    PrayerItemCreate, PrayerItemUpdate, PrayerItemResponse
)
from .settings import get_default_user

router = APIRouter()


# Bible Plans
@router.get("/plans", response_model=List[BiblePlanResponse])
def list_bible_plans(db: Session = Depends(get_db), user: User = Depends(get_default_user)):
    """List all Bible plans for the user."""
    return db.query(BiblePlan).filter(BiblePlan.user_id == user.id).all()


@router.post("/plans", response_model=BiblePlanResponse)
def create_bible_plan(
    plan: BiblePlanCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new Bible plan."""
    db_plan = BiblePlan(user_id=user.id, **plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.get("/plans/{plan_id}", response_model=BiblePlanResponse)
def get_bible_plan(plan_id: int, db: Session = Depends(get_db)):
    """Get a specific Bible plan."""
    plan = db.query(BiblePlan).filter(BiblePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Bible plan not found")
    return plan


@router.put("/plans/{plan_id}", response_model=BiblePlanResponse)
def update_bible_plan(plan_id: int, plan_data: BiblePlanCreate, db: Session = Depends(get_db)):
    """Update a Bible plan."""
    plan = db.query(BiblePlan).filter(BiblePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Bible plan not found")

    for key, value in plan_data.model_dump(exclude_unset=True).items():
        setattr(plan, key, value)

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}")
def delete_bible_plan(plan_id: int, db: Session = Depends(get_db)):
    """Delete a Bible plan."""
    plan = db.query(BiblePlan).filter(BiblePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Bible plan not found")

    db.delete(plan)
    db.commit()
    return {"status": "deleted"}


# Bible Readings
@router.get("/readings", response_model=List[BibleReadingResponse])
def list_bible_readings(
    plan_id: int = None,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db)
):
    """List Bible readings."""
    query = db.query(BibleReading)

    if plan_id:
        query = query.filter(BibleReading.plan_id == plan_id)
    if start:
        query = query.filter(BibleReading.dt >= start)
    if end:
        query = query.filter(BibleReading.dt <= end)

    return query.order_by(BibleReading.dt.desc()).all()


@router.post("/readings", response_model=BibleReadingResponse)
def create_bible_reading(reading: BibleReadingCreate, db: Session = Depends(get_db)):
    """Create a new Bible reading."""
    db_reading = BibleReading(**reading.model_dump())
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading


@router.delete("/readings/{reading_id}")
def delete_bible_reading(reading_id: int, db: Session = Depends(get_db)):
    """Delete a Bible reading."""
    reading = db.query(BibleReading).filter(BibleReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Bible reading not found")

    db.delete(reading)
    db.commit()
    return {"status": "deleted"}


# Bible Reflections
@router.get("/reflections", response_model=List[BibleReflectionResponse])
def list_bible_reflections(
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List Bible reflections."""
    query = db.query(BibleReflection).filter(BibleReflection.user_id == user.id)

    if start:
        query = query.filter(BibleReflection.dt >= start)
    if end:
        query = query.filter(BibleReflection.dt <= end)

    return query.order_by(BibleReflection.dt.desc()).all()


@router.post("/reflections", response_model=BibleReflectionResponse)
def create_bible_reflection(
    reflection: BibleReflectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new Bible reflection."""
    db_reflection = BibleReflection(user_id=user.id, **reflection.model_dump())
    db.add(db_reflection)
    db.commit()
    db.refresh(db_reflection)
    return db_reflection


@router.delete("/reflections/{reflection_id}")
def delete_bible_reflection(reflection_id: int, db: Session = Depends(get_db)):
    """Delete a Bible reflection."""
    reflection = db.query(BibleReflection).filter(BibleReflection.id == reflection_id).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Bible reflection not found")

    db.delete(reflection)
    db.commit()
    return {"status": "deleted"}


# Prayer Items
@router.get("/prayers", response_model=List[PrayerItemResponse])
def list_prayer_items(
    status: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List prayer items."""
    query = db.query(PrayerItem).filter(PrayerItem.user_id == user.id)

    if status:
        query = query.filter(PrayerItem.status == status)

    return query.order_by(PrayerItem.created_at.desc()).all()


@router.post("/prayers", response_model=PrayerItemResponse)
def create_prayer_item(
    prayer: PrayerItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new prayer item."""
    db_prayer = PrayerItem(user_id=user.id, **prayer.model_dump())
    db.add(db_prayer)
    db.commit()
    db.refresh(db_prayer)
    return db_prayer


@router.get("/prayers/{prayer_id}", response_model=PrayerItemResponse)
def get_prayer_item(prayer_id: int, db: Session = Depends(get_db)):
    """Get a specific prayer item."""
    prayer = db.query(PrayerItem).filter(PrayerItem.id == prayer_id).first()
    if not prayer:
        raise HTTPException(status_code=404, detail="Prayer item not found")
    return prayer


@router.put("/prayers/{prayer_id}", response_model=PrayerItemResponse)
def update_prayer_item(prayer_id: int, prayer_data: PrayerItemUpdate, db: Session = Depends(get_db)):
    """Update a prayer item."""
    prayer = db.query(PrayerItem).filter(PrayerItem.id == prayer_id).first()
    if not prayer:
        raise HTTPException(status_code=404, detail="Prayer item not found")

    for key, value in prayer_data.model_dump(exclude_unset=True).items():
        setattr(prayer, key, value)

    db.commit()
    db.refresh(prayer)
    return prayer


@router.delete("/prayers/{prayer_id}")
def delete_prayer_item(prayer_id: int, db: Session = Depends(get_db)):
    """Delete a prayer item."""
    prayer = db.query(PrayerItem).filter(PrayerItem.id == prayer_id).first()
    if not prayer:
        raise HTTPException(status_code=404, detail="Prayer item not found")

    db.delete(prayer)
    db.commit()
    return {"status": "deleted"}
