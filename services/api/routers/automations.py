"""Automations router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import AutomationRule, AutomationLog, User
from ..schemas import AutomationRuleCreate, AutomationRuleUpdate, AutomationRuleResponse, AutomationLogResponse
from .settings import get_default_user

router = APIRouter()


@router.get("", response_model=List[AutomationRuleResponse])
def list_automation_rules(
    is_active: bool = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all automation rules for the user."""
    query = db.query(AutomationRule).filter(AutomationRule.user_id == user.id)

    if is_active is not None:
        query = query.filter(AutomationRule.is_active == is_active)

    return query.all()


@router.post("", response_model=AutomationRuleResponse)
def create_automation_rule(
    rule: AutomationRuleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new automation rule."""
    db_rule = AutomationRule(user_id=user.id, **rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.get("/{rule_id}", response_model=AutomationRuleResponse)
def get_automation_rule(rule_id: int, db: Session = Depends(get_db)):
    """Get a specific automation rule."""
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    return rule


@router.put("/{rule_id}", response_model=AutomationRuleResponse)
def update_automation_rule(rule_id: int, rule_data: AutomationRuleUpdate, db: Session = Depends(get_db)):
    """Update an automation rule."""
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")

    for key, value in rule_data.model_dump(exclude_unset=True).items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_automation_rule(rule_id: int, db: Session = Depends(get_db)):
    """Delete an automation rule."""
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")

    db.delete(rule)
    db.commit()
    return {"status": "deleted"}


@router.get("/logs", response_model=List[AutomationLogResponse])
def list_automation_logs(
    rule_id: int = None,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db)
):
    """List automation logs."""
    query = db.query(AutomationLog)

    if rule_id:
        query = query.filter(AutomationLog.rule_id == rule_id)
    if start:
        query = query.filter(AutomationLog.dt >= start)
    if end:
        query = query.filter(AutomationLog.dt <= end)

    return query.order_by(AutomationLog.dt.desc()).limit(100).all()
