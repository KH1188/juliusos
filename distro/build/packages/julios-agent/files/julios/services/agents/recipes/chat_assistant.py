"""
Conversational assistant recipe for general queries and assistance.
"""
from datetime import datetime, timedelta
from ..core.context_builder import ContextBuilder
from ..core.ollama_client import OllamaClient
import json


async def run_chat_assistant(user_id: int, message: str) -> dict:
    """
    Run conversational assistant that can help with general queries.
    Has access to user context and can provide intelligent responses.
    """
    if not message:
        return {"response": "How can I help you today?"}

    # Build comprehensive context
    context_builder = ContextBuilder()
    context = await context_builder.build_context(
        user_id=user_id,
        window_days=7,
        include_modules=["tasks", "events", "goals", "sleep", "workouts", "meals"]
    )
    await context_builder.close()

    # Build context summary
    tasks = context.get("tasks", [])
    events = context.get("events", [])
    sleep_logs = context.get("sleep", [])
    goals = context.get("goals", [])

    pending_tasks = len([t for t in tasks if t.get("status") == "todo"])
    today_events = len(events[:3])
    avg_sleep = sum(s.get("duration_min", 0) for s in sleep_logs[:3]) / max(len(sleep_logs[:3]), 1) / 60
    active_goals = [g.get("title") for g in goals[:3]]

    # Build prompt
    prompt = f"""You are the operator's personal AI assistant. Be helpful, conversational, and reference their data when relevant.

CONTEXT:
- Today: {datetime.utcnow().strftime("%A, %B %d")}
- Pending tasks: {pending_tasks}
- Upcoming events today: {today_events}
- Recent sleep average: {avg_sleep:.1f} hours
- Active goals: {', '.join(active_goals) if active_goals else 'None'}

USER MESSAGE: {message}

Respond in 2-4 sentences. Be warm, helpful, and actionable."""

    # Query LLM
    ollama = OllamaClient()
    result = await ollama.generate(
        model="llama3:8b",
        prompt=prompt,
        temperature=0.7
    )
    await ollama.close()

    return {
        "response": result.get("response", "")
    }
