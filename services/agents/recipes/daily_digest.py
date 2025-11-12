"""Daily digest recipe."""
import json
from pathlib import Path
from ..core.ollama_client import OllamaClient
from ..core.context_builder import ContextBuilder


async def run_daily_digest(user_id: int) -> dict:
    """Generate daily digest for user.

    Args:
        user_id: User ID

    Returns:
        Dict with plan, conflicts, blocks, health, bible, journal_prompt
    """
    # Build context
    context_builder = ContextBuilder()
    context = await context_builder.build_context(
        user_id=user_id,
        window_days=7,
        include_modules=["tasks", "events", "habits", "meals", "workouts", "sleep", "journal", "bible"]
    )
    await context_builder.close()

    # Load prompt template
    prompt_path = Path(__file__).parent.parent / "prompts" / "daily_digest.txt"
    with open(prompt_path) as f:
        prompt_template = f.read()

    # Substitute context
    prompt = prompt_template.replace("{{window_days}}", str(context["window_days"]))
    prompt = prompt.replace("{{context_json}}", json.dumps(context, indent=2))

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
            digest = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            digest = {
                "plan": [],
                "conflicts": [],
                "blocks": [],
                "health": {"macro_delta": "Unable to analyze", "workout_suggestion": "", "sleep_note": ""},
                "bible": {"next_passage": "", "rationale": ""},
                "journal_prompt": "What are you grateful for today?",
                "error": "Failed to parse agent response"
            }

        return digest

    finally:
        await client.close()
