"""Contacts and relationships router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Contact, Interaction, User
from ..schemas import ContactCreate, ContactUpdate, ContactResponse, InteractionCreate, InteractionResponse
from .settings import get_default_user

router = APIRouter()


# Contacts
@router.get("", response_model=List[ContactResponse])
def list_contacts(db: Session = Depends(get_db), user: User = Depends(get_default_user)):
    """List all contacts for the user."""
    return db.query(Contact).filter(Contact.user_id == user.id).all()


@router.post("", response_model=ContactResponse)
def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new contact."""
    db_contact = Contact(user_id=user.id, **contact.model_dump())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    """Get a specific contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(contact_id: int, contact_data: ContactUpdate, db: Session = Depends(get_db)):
    """Update a contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    for key, value in contact_data.model_dump(exclude_unset=True).items():
        setattr(contact, key, value)

    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    """Delete a contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(contact)
    db.commit()
    return {"status": "deleted"}


# Interactions
@router.get("/interactions", response_model=List[InteractionResponse])
def list_interactions(
    contact_id: int = None,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all interactions for the user."""
    query = db.query(Interaction).filter(Interaction.user_id == user.id)

    if contact_id:
        query = query.filter(Interaction.contact_id == contact_id)
    if start:
        query = query.filter(Interaction.dt >= start)
    if end:
        query = query.filter(Interaction.dt <= end)

    return query.order_by(Interaction.dt.desc()).all()


@router.post("/interactions", response_model=InteractionResponse)
def create_interaction(
    interaction: InteractionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new interaction."""
    db_interaction = Interaction(user_id=user.id, **interaction.model_dump())
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction


@router.get("/interactions/{interaction_id}", response_model=InteractionResponse)
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Get a specific interaction."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.put("/interactions/{interaction_id}", response_model=InteractionResponse)
def update_interaction(interaction_id: int, interaction_data: InteractionCreate, db: Session = Depends(get_db)):
    """Update an interaction."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    for key, value in interaction_data.model_dump(exclude_unset=True).items():
        setattr(interaction, key, value)

    db.commit()
    db.refresh(interaction)
    return interaction


@router.delete("/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Delete an interaction."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    db.delete(interaction)
    db.commit()
    return {"status": "deleted"}
