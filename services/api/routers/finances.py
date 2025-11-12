"""Finances router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Budget, Transaction, SavingsGoal, User
from ..schemas import (
    BudgetCreate, BudgetResponse,
    TransactionCreate, TransactionResponse,
    SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse
)
from .settings import get_default_user

router = APIRouter()


# Budgets
@router.get("/budgets", response_model=List[BudgetResponse])
def list_budgets(
    month: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all budgets for the user."""
    query = db.query(Budget).filter(Budget.user_id == user.id)

    if month:
        query = query.filter(Budget.month_yyyymm == month)

    return query.all()


@router.post("/budgets", response_model=BudgetResponse)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new budget."""
    db_budget = Budget(user_id=user.id, **budget.model_dump())
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget


@router.get("/budgets/{budget_id}", response_model=BudgetResponse)
def get_budget(budget_id: int, db: Session = Depends(get_db)):
    """Get a specific budget."""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.put("/budgets/{budget_id}", response_model=BudgetResponse)
def update_budget(budget_id: int, budget_data: BudgetCreate, db: Session = Depends(get_db)):
    """Update a budget."""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    for key, value in budget_data.model_dump(exclude_unset=True).items():
        setattr(budget, key, value)

    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/budgets/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    """Delete a budget."""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return {"status": "deleted"}


# Transactions
@router.get("/transactions", response_model=List[TransactionResponse])
def list_transactions(
    start: datetime = None,
    end: datetime = None,
    category: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """List all transactions for the user."""
    query = db.query(Transaction).filter(Transaction.user_id == user.id)

    if start:
        query = query.filter(Transaction.dt >= start)
    if end:
        query = query.filter(Transaction.dt <= end)
    if category:
        query = query.filter(Transaction.category == category)

    return query.order_by(Transaction.dt.desc()).all()


@router.post("/transactions", response_model=TransactionResponse)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new transaction."""
    db_transaction = Transaction(user_id=user.id, **transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a specific transaction."""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: int, transaction_data: TransactionCreate, db: Session = Depends(get_db)):
    """Update a transaction."""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in transaction_data.model_dump(exclude_unset=True).items():
        setattr(transaction, key, value)

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete a transaction."""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    return {"status": "deleted"}


# Savings Goals
@router.get("/savings-goals", response_model=List[SavingsGoalResponse])
def list_savings_goals(db: Session = Depends(get_db), user: User = Depends(get_default_user)):
    """List all savings goals for the user."""
    return db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id).all()


@router.post("/savings-goals", response_model=SavingsGoalResponse)
def create_savings_goal(
    goal: SavingsGoalCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Create a new savings goal."""
    db_goal = SavingsGoal(user_id=user.id, **goal.model_dump())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.get("/savings-goals/{goal_id}", response_model=SavingsGoalResponse)
def get_savings_goal(goal_id: int, db: Session = Depends(get_db)):
    """Get a specific savings goal."""
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return goal


@router.put("/savings-goals/{goal_id}", response_model=SavingsGoalResponse)
def update_savings_goal(goal_id: int, goal_data: SavingsGoalUpdate, db: Session = Depends(get_db)):
    """Update a savings goal."""
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    for key, value in goal_data.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/savings-goals/{goal_id}")
def delete_savings_goal(goal_id: int, db: Session = Depends(get_db)):
    """Delete a savings goal."""
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    db.delete(goal)
    db.commit()
    return {"status": "deleted"}
