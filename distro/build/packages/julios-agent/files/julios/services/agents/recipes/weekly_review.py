"""Weekly review recipe."""
import json
from pathlib import Path
from ..core.ollama_client import OllamaClient
from ..core.context_builder import ContextBuilder


async def run_weekly_review(user_id: int) -> dict:
    """Generate weekly review for user.

    Args:
        user_id: User ID

    Returns:
        Dict with wins, improvements, metrics, goals_checkin, habit_notes
    """
    # Build context for past 7 days
    context_builder = ContextBuilder()
    context = await context_builder.build_context(
        user_id=user_id,
        window_days=7,
    )
    await context_builder.close()

    # Load prompt template
    prompt_path = Path(__file__).parent.parent / "prompts" / "weekly_review.txt"
    with open(prompt_path) as f:
        prompt_template = f.read()

    # Substitute context
    prompt = prompt_template.replace("{{context_json}}", json.dumps(context, indent=2))

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
            review = json.loads(response_text)
        except json.JSONDecodeError:
            review = {
                "wins": [],
                "improvements": [],
                "metrics": {},
                "goals_checkin": [],
                "habit_notes": [],
                "error": "Failed to parse agent response"
            }

        return review

    finally:
        await client.close()
