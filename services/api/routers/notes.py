"""Notes and personal wiki router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Note, NoteLink, User
from ..schemas import NoteCreate, NoteUpdate, NoteResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[NoteResponse])
def list_notes(
    search: str = None,
    tag: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all notes for the user."""
    query = db.query(Note).filter(Note.user_id == user.id)

    if search:
        query = query.filter(
            (Note.title.contains(search)) | (Note.content_md.contains(search))
        )
    if tag:
        query = query.filter(Note.tags.contains(tag))

    return query.order_by(Note.updated_at.desc()).all()


@router.post("", response_model=NoteResponse)
def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new note."""
    db_note = Note(user_id=user.id, **note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """Get a specific note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note_data: NoteUpdate, db: Session = Depends(get_db)):
    """Update a note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    for key, value in note_data.model_dump(exclude_unset=True).items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"status": "deleted"}


@router.post("/{note_id}/links")
def create_note_link(note_id: int, target_note_id: int, db: Session = Depends(get_db)):
    """Create a link between two notes."""
    # Check both notes exist
    src_note = db.query(Note).filter(Note.id == note_id).first()
    dst_note = db.query(Note).filter(Note.id == target_note_id).first()

    if not src_note or not dst_note:
        raise HTTPException(status_code=404, detail="One or both notes not found")

    # Check if link already exists
    existing = db.query(NoteLink).filter(
        NoteLink.src_note_id == note_id,
        NoteLink.dst_note_id == target_note_id
    ).first()

    if existing:
        return {"status": "link already exists"}

    link = NoteLink(src_note_id=note_id, dst_note_id=target_note_id)
    db.add(link)
    db.commit()
    return {"status": "link created"}


@router.get("/{note_id}/links")
def get_note_links(note_id: int, db: Session = Depends(get_db)):
    """Get all links for a note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    outgoing = db.query(NoteLink).filter(NoteLink.src_note_id == note_id).all()
    incoming = db.query(NoteLink).filter(NoteLink.dst_note_id == note_id).all()

    return {
        "outgoing": [{"id": l.id, "target_note_id": l.dst_note_id} for l in outgoing],
        "incoming": [{"id": l.id, "source_note_id": l.src_note_id} for l in incoming],
    }
