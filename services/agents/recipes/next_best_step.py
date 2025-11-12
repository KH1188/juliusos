"""Next best step recipe - recommends one high-leverage action."""
import json
from pathlib import Path
from datetime import datetime, timedelta
from ..core.ollama_client import OllamaClient
from ..core.context_builder import ContextBuilder


async def run_next_best_step(user_id: int) -> dict:
    """Recommend the next best action right now.

    Args:
        user_id: User ID

    Returns:
        Dict with action, duration_min, why, refs
    """
    # Build 2-hour context window
    context_builder = ContextBuilder()
    context = await context_builder.build_context(
        user_id=user_id,
        window_days=1,
        include_modules=["tasks", "events", "goals", "sleep", "workouts"]
    )
    await context_builder.close()

    # Filter to next 2 hours
    now = datetime.utcnow()
    two_hours = now + timedelta(hours=2)

    context_2h = {
        "events_next_2h": [
            e for e in context.get("events", [])
            if now <= datetime.fromisoformat(e["start_ts"].replace("Z", "+00:00")) <= two_hours
        ],
        "tasks_high_priority": [
            t for t in context.get("tasks", [])
            if t.get("priority", 0) >= 3 and t.get("status") != "done"
        ][:5],
    }

    # Calculate fatigue signal
    recent_sleep = context.get("sleep", [])
    recent_workouts = context.get("workouts", [])

    avg_sleep = sum(s.get("duration_min", 0) for s in recent_sleep[:3]) / max(len(recent_sleep[:3]), 1)
    workout_count_3d = len([w for w in recent_workouts if datetime.fromisoformat(w["dt"].replace("Z", "+00:00")) >= now - timedelta(days=3)])

    fatigue_signal = {
        "avg_sleep_hours": round(avg_sleep / 60, 1),
        "workouts_last_3d": workout_count_3d,
        "energy_level": "high" if avg_sleep >= 420 and workout_count_3d <= 2 else "medium" if avg_sleep >= 360 else "low"
    }

    # Load prompt template
    prompt_path = Path(__file__).parent.parent / "prompts" / "next_best_step.txt"
    with open(prompt_path) as f:
        prompt_template = f.read()

    # Substitute
    prompt = prompt_template.replace("{{context_2h_window}}", json.dumps(context_2h, indent=2))
    prompt = prompt.replace("{{goals_today}}", json.dumps(context.get("goals", []), indent=2))
    prompt = prompt.replace("{{fatigue_signal}}", json.dumps(fatigue_signal, indent=2))

    # Call Ollama
    client = OllamaClient()
    try:
        result = await client.generate(
            prompt=prompt,
            temperature=0.3,
            format="json",
        )

        response_text = result.get("response", "{}")
        try:
            next_step = json.loads(response_text)
        except json.JSONDecodeError:
            next_step = {
                "action": "Take a short break",
                "duration_min": 10,
                "why": "Unable to analyze context",
                "refs": []
            }

        return next_step

    finally:
        await client.close()
