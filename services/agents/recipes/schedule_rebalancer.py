"""Schedule rebalancer recipe."""
import json
from pathlib import Path
from datetime import datetime
from ..core.ollama_client import OllamaClient
from ..core.context_builder import ContextBuilder


async def run_schedule_rebalancer(user_id: int) -> dict:
    """Rebalance today's schedule.

    Args:
        user_id: User ID

    Returns:
        Dict with blocks, dropped, rationale
    """
    # Get today's events and top tasks
    context_builder = ContextBuilder()
    context = await context_builder.build_context(
        user_id=user_id,
        window_days=1,
        include_modules=["tasks", "events"]
    )
    await context_builder.close()

    events_today = context.get("events", [])
    tasks = context.get("tasks", [])[:10]  # Top 10 by priority

    # Load prompt template
    prompt_path = Path(__file__).parent.parent / "prompts" / "schedule_rebalancer.txt"
    with open(prompt_path) as f:
        prompt_template = f.read()

    # Substitute
    prompt = prompt_template.replace("{{events_json}}", json.dumps(events_today, indent=2))
    prompt = prompt.replace("{{tasks_json}}", json.dumps(tasks, indent=2))

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
            schedule = json.loads(response_text)
        except json.JSONDecodeError:
            schedule = {
                "blocks": [],
                "dropped": [],
                "rationale": "Unable to analyze schedule",
                "error": "Failed to parse agent response"
            }

        return schedule

    finally:
        await client.close()
