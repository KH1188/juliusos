"""Skills and learning router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Skill, LearningSession, User
from ..schemas import SkillCreate, SkillResponse, LearningSessionCreate, LearningSessionResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[SkillResponse])
def list_skills(db: Session = Depends(get_db), user: User = Depends(get_default_user)):
    """List all skills for the user."""
    return db.query(Skill).filter(Skill.user_id == user.id).all()


@router.post("", response_model=SkillResponse)
def create_skill(
    skill: SkillCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new skill."""
    db_skill = Skill(user_id=user.id, **skill.model_dump())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill


@router.get("/{skill_id}", response_model=SkillResponse)
def get_skill(skill_id: int, db: Session = Depends(get_db)):
    """Get a specific skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@router.put("/{skill_id}", response_model=SkillResponse)
def update_skill(skill_id: int, skill_data: SkillCreate, db: Session = Depends(get_db)):
    """Update a skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    for key, value in skill_data.model_dump(exclude_unset=True).items():
        setattr(skill, key, value)

    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    """Delete a skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    db.delete(skill)
    db.commit()
    return {"status": "deleted"}


@router.get("/learning-sessions", response_model=List[LearningSessionResponse])
def list_learning_sessions(
    skill_id: int = None,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all learning sessions for the user."""
    query = db.query(LearningSession).filter(LearningSession.user_id == user.id)

    if skill_id:
        query = query.filter(LearningSession.skill_id == skill_id)
    if start:
        query = query.filter(LearningSession.dt >= start)
    if end:
        query = query.filter(LearningSession.dt <= end)

    return query.order_by(LearningSession.dt.desc()).all()


@router.post("/learning-sessions", response_model=LearningSessionResponse)
def create_learning_session(
    session: LearningSessionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new learning session."""
    db_session = LearningSession(user_id=user.id, **session.model_dump())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/learning-sessions/{session_id}", response_model=LearningSessionResponse)
def get_learning_session(session_id: int, db: Session = Depends(get_db)):
    """Get a specific learning session."""
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Learning session not found")
    return session


@router.put("/learning-sessions/{session_id}", response_model=LearningSessionResponse)
def update_learning_session(session_id: int, session_data: LearningSessionCreate, db: Session = Depends(get_db)):
    """Update a learning session."""
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Learning session not found")

    for key, value in session_data.model_dump(exclude_unset=True).items():
        setattr(session, key, value)

    db.commit()
    db.refresh(session)
    return session


@router.delete("/learning-sessions/{session_id}")
def delete_learning_session(session_id: int, db: Session = Depends(get_db)):
    """Delete a learning session."""
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Learning session not found")

    db.delete(session)
    db.commit()
    return {"status": "deleted"}
