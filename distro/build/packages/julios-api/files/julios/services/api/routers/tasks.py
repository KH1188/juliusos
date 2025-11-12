"""Tasks router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Task, User
from ..schemas import TaskCreate, TaskUpdate, TaskResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all tasks for the user."""
    query = db.query(Task).filter(Task.user_id == user.id)

    if status:
        query = query.filter(Task.status == status)
    if project_id:
        query = query.filter(Task.project_id == project_id)

    return query.order_by(Task.priority.desc(), Task.due_ts).all()


@router.post("", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new task."""
    db_task = Task(user_id=user.id, **task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for key, value in task_data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(task_id: int, status: str, db: Session = Depends(get_db)):
    """Update task status."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if status not in ["todo", "doing", "done"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    task.status = status
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"status": "deleted"}
