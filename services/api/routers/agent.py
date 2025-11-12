"""Agent endpoints router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import AgentAskRequest, AgentAskResponse, DailyDigestResponse, WeeklyReviewResponse
from .settings import get_default_user
import httpx
import os

router = APIRouter()

# Agent service URL (will be running separately)
AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://localhost:8001")


@router.post("/ask", response_model=AgentAskResponse)
async def agent_ask(
    request: AgentAskRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Ask the agent a question with context."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/ask",
                json={
                    "query": request.query,
                    "user_id": user.id,
                    "context_window_days": request.context_window_days,
                }
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Agent service error: {str(e)}")


@router.post("/digest/daily", response_model=DailyDigestResponse)
async def daily_digest(
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Generate daily digest."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/digest/daily",
                json={"user_id": user.id}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Agent service error: {str(e)}")


@router.post("/review/weekly", response_model=WeeklyReviewResponse)
async def weekly_review(
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Generate weekly review."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/review/weekly",
                json={"user_id": user.id}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Agent service error: {str(e)}")


@router.post("/actions/run")
async def run_action(
    action_name: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Run a named agent action."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/actions/run",
                json={"action_name": action_name, "user_id": user.id}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Agent service error: {str(e)}")


@router.post("/recipes/{recipe_name}")
async def run_recipe(
    recipe_name: str,
    params: dict = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Run a named recipe (e.g., sleep_optimizer, macro_coach, bible_reflector)."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/recipes/{recipe_name}",
                json={"user_id": user.id, "params": params or {}}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Agent service error: {str(e)}")


@router.post("/next-best-step")
async def next_best_step(
    db: Session = Depends(get_db),
    user: User = Depends(get_default_user)
):
    """Get the next best step recommendation."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/recipes/next_best_step",
                json={"user_id": user.id, "params": {}}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Agent service error: {str(e)}")
