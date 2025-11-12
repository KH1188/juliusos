"""Relationships and nurture cycles router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, NurtureCycle
from ..schemas import NurtureCycleCreate, NurtureCycleUpdate, NurtureCycleResponse
from .settings import get_default_user

router = APIRouter()


@router.get("/nurture-cycles", response_model=List[NurtureCycleResponse])
def list_nurture_cycles(
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all nurture cycles with their contacts."""
    # Get all contacts for the user
    from ..models import Contact
    contacts = db.query(Contact).filter(Contact.user_id == user.id).all()
    contact_ids = [c.id for c in contacts]

    cycles = db.query(NurtureCycle).filter(
        NurtureCycle.contact_id.in_(contact_ids)
    ).all()

    return cycles


@router.post("/nurture-cycles", response_model=NurtureCycleResponse)
def create_nurture_cycle(
    cycle: NurtureCycleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new nurture cycle for a contact."""
    # Verify the contact belongs to the user
    from ..models import Contact
    contact = db.query(Contact).filter(
        Contact.id == cycle.contact_id,
        Contact.user_id == user.id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Check if cycle already exists
    existing = db.query(NurtureCycle).filter(
        NurtureCycle.contact_id == cycle.contact_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Nurture cycle already exists for this contact")

    db_cycle = NurtureCycle(**cycle.model_dump())
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle


@router.get("/nurture-cycles/{cycle_id}", response_model=NurtureCycleResponse)
def get_nurture_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Get a specific nurture cycle."""
    cycle = db.query(NurtureCycle).filter(NurtureCycle.id == cycle_id).first()

    if not cycle:
        raise HTTPException(status_code=404, detail="Nurture cycle not found")

    # Verify the contact belongs to the user
    from ..models import Contact
    contact = db.query(Contact).filter(
        Contact.id == cycle.contact_id,
        Contact.user_id == user.id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    return cycle


@router.patch("/nurture-cycles/{cycle_id}", response_model=NurtureCycleResponse)
def update_nurture_cycle(
    cycle_id: int,
    cycle_update: NurtureCycleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Update a nurture cycle."""
    cycle = db.query(NurtureCycle).filter(NurtureCycle.id == cycle_id).first()

    if not cycle:
        raise HTTPException(status_code=404, detail="Nurture cycle not found")

    # Verify the contact belongs to the user
    from ..models import Contact
    contact = db.query(Contact).filter(
        Contact.id == cycle.contact_id,
        Contact.user_id == user.id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    for key, value in cycle_update.model_dump(exclude_unset=True).items():
        setattr(cycle, key, value)

    db.commit()
    db.refresh(cycle)
    return cycle


@router.delete("/nurture-cycles/{cycle_id}")
def delete_nurture_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Delete a nurture cycle."""
    cycle = db.query(NurtureCycle).filter(NurtureCycle.id == cycle_id).first()

    if not cycle:
        raise HTTPException(status_code=404, detail="Nurture cycle not found")

    # Verify the contact belongs to the user
    from ..models import Contact
    contact = db.query(Contact).filter(
        Contact.id == cycle.contact_id,
        Contact.user_id == user.id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(cycle)
    db.commit()
    return {"status": "deleted"}
