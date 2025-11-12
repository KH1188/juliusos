"""Skin & hygiene router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import SkinProduct, SkinRoutine, SkinLog, User
from ..schemas import (
    SkinProductCreate, SkinProductResponse,
    SkinRoutineCreate, SkinRoutineResponse,
    SkinLogCreate, SkinLogResponse
)
from .settings import get_default_user

router = APIRouter()


# Products
@router.get("/products", response_model=List[SkinProductResponse])
def list_skin_products(
    is_active: bool = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all skin products for the user."""
    query = db.query(SkinProduct).filter(SkinProduct.user_id == user.id)

    if is_active is not None:
        query = query.filter(SkinProduct.is_active == is_active)

    return query.all()


@router.post("/products", response_model=SkinProductResponse)
def create_skin_product(
    product: SkinProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new skin product."""
    db_product = SkinProduct(user_id=user.id, **product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/products/{product_id}", response_model=SkinProductResponse)
def update_skin_product(
    product_id: int,
    product_data: SkinProductCreate,
    db: Session = Depends(get_db)
):
    """Update a skin product."""
    product = db.query(SkinProduct).filter(SkinProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in product_data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}")
def delete_skin_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a skin product."""
    product = db.query(SkinProduct).filter(SkinProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"status": "deleted"}


# Routines
@router.get("/routines", response_model=List[SkinRoutineResponse])
def list_skin_routines(
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all skin routines for the user."""
    return db.query(SkinRoutine).filter(SkinRoutine.user_id == user.id).all()


@router.post("/routines", response_model=SkinRoutineResponse)
def create_skin_routine(
    routine: SkinRoutineCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new skin routine."""
    db_routine = SkinRoutine(user_id=user.id, **routine.model_dump())
    db.add(db_routine)
    db.commit()
    db.refresh(db_routine)
    return db_routine


@router.put("/routines/{routine_id}", response_model=SkinRoutineResponse)
def update_skin_routine(
    routine_id: int,
    routine_data: SkinRoutineCreate,
    db: Session = Depends(get_db)
):
    """Update a skin routine."""
    routine = db.query(SkinRoutine).filter(SkinRoutine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    for key, value in routine_data.model_dump(exclude_unset=True).items():
        setattr(routine, key, value)

    db.commit()
    db.refresh(routine)
    return routine


# Logs
@router.get("/logs", response_model=List[SkinLogResponse])
def list_skin_logs(
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List skin logs for the user."""
    query = db.query(SkinLog).filter(SkinLog.user_id == user.id)

    if start:
        query = query.filter(SkinLog.dt >= start)
    if end:
        query = query.filter(SkinLog.dt <= end)

    return query.order_by(SkinLog.dt.desc()).all()


@router.post("/logs", response_model=SkinLogResponse)
def create_skin_log(
    log: SkinLogCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new skin log."""
    db_log = SkinLog(user_id=user.id, **log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
