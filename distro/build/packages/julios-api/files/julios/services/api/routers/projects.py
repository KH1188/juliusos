"""Projects router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Project, User
from ..schemas import ProjectCreate, ProjectResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    status: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all projects for the user."""
    query = db.query(Project).filter(Project.user_id == user.id)

    if status:
        query = query.filter(Project.status == status)

    return query.all()


@router.post("", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new project."""
    db_project = Project(user_id=user.id, **project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project_data: ProjectCreate, db: Session = Depends(get_db)):
    """Update a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for key, value in project_data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"status": "deleted"}
