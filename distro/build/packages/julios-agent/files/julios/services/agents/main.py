"""Main agent service API."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from .recipes.daily_digest import run_daily_digest
from .recipes.weekly_review import run_weekly_review
from .recipes.bible_reflector import run_bible_reflector
from .recipes.macro_coach import run_macro_coach
from .recipes.schedule_rebalancer import run_schedule_rebalancer
from .recipes.profile_update import run_profile_update
from .recipes.next_best_step import run_next_best_step
from .recipes.skin_coach import run_skin_coach
from .recipes.chat_assistant import run_chat_assistant
from .recipes.code_assistant import run_code_assistant
from .core.ollama_client import OllamaClient
from .core.context_builder import ContextBuilder
import json

app = FastAPI(
    title="JuliOS Agent Service",
    description="AI agent service for JuliOS",
    version="2.0.0",
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    query: str
    user_id: int
    context_window_days: int = 7


class DigestRequest(BaseModel):
    user_id: int


class RecipeRequest(BaseModel):
    user_id: int
    params: Dict[str, Any] = {}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    client = OllamaClient()
    ollama_healthy = await client.check_health()
    await client.close()

    return {
        "status": "ok" if ollama_healthy else "degraded",
        "ollama_available": ollama_healthy,
    }


@app.post("/ask")
async def agent_ask(request: AskRequest):
    """Ask the agent a question with context."""
    try:
        # Build context
        context_builder = ContextBuilder()
        context = await context_builder.build_context(
            user_id=request.user_id,
            window_days=request.context_window_days,
        )
        await context_builder.close()

        # Create prompt
        system = """You are a helpful personal assistant with access to the user's life data.
Answer questions based on the context provided. Be concise and actionable."""

        user_prompt = f"""CONTEXT:
{json.dumps(context, indent=2)}

QUESTION:
{request.query}

Provide a helpful answer based on the context."""

        # Call Ollama
        client = OllamaClient()
        try:
            result = await client.generate(
                prompt=user_prompt,
                system=system,
                temperature=0.4,
            )

            return {
                "answer": result.get("response", ""),
                "sources": [],
                "reasoning": None,
            }
        finally:
            await client.close()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/digest/daily")
async def daily_digest(request: DigestRequest):
    """Generate daily digest."""
    try:
        digest = await run_daily_digest(request.user_id)
        return digest
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/review/weekly")
async def weekly_review(request: DigestRequest):
    """Generate weekly review."""
    try:
        review = await run_weekly_review(request.user_id)
        return review
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/actions/run")
async def run_action(action_name: str, user_id: int):
    """Run a named action."""
    # Map action names to functions
    actions = {
        "rebalance_schedule": run_schedule_rebalancer,
    }

    if action_name not in actions:
        raise HTTPException(status_code=404, detail=f"Action '{action_name}' not found")

    try:
        result = await actions[action_name](user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recipes/{recipe_name}")
async def run_recipe(recipe_name: str, request: RecipeRequest):
    """Run a named recipe."""
    recipes = {
        "bible_reflector": lambda: run_bible_reflector(
            request.user_id,
            request.params.get("passage", "")
        ),
        "macro_coach": lambda: run_macro_coach(
            request.user_id,
            request.params.get("targets")
        ),
        "schedule_rebalancer": lambda: run_schedule_rebalancer(request.user_id),
        "daily_digest": lambda: run_daily_digest(request.user_id),
        "weekly_review": lambda: run_weekly_review(request.user_id),
        "profile_update": lambda: run_profile_update(request.user_id),
        "next_best_step": lambda: run_next_best_step(request.user_id),
        "skin_coach": lambda: run_skin_coach(request.user_id),
        "chat_assistant": lambda: run_chat_assistant(request.user_id, request.params.get("message", "")),
        "code_assistant": lambda: run_code_assistant(
            request.user_id,
            request.params.get("message", ""),
            request.params.get("files", []),
            request.params.get("operation")
        ),
    }

    if recipe_name not in recipes:
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_name}' not found")

    try:
        result = await recipes[recipe_name]()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
