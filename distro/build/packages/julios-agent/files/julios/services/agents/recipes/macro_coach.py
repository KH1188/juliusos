"""Macro coach recipe."""
import json
from pathlib import Path
from datetime import datetime
from ..core.ollama_client import OllamaClient
from ..core.context_builder import ContextBuilder


async def run_macro_coach(user_id: int, targets: dict = None) -> dict:
    """Generate macro coaching suggestions.

    Args:
        user_id: User ID
        targets: Dict with protein_g, calories, etc. (defaults if None)

    Returns:
        Dict with protein_gap_g, suggestions, warnings
    """
    # Default targets
    if not targets:
        targets = {
            "protein_g": 150,
            "calories": 2500,
            "carbs_g": 250,
            "fat_g": 80,
        }

    # Get today's meals
    context_builder = ContextBuilder()
    context = await context_builder.build_context(
        user_id=user_id,
        window_days=1,
        include_modules=["meals"]
    )
    await context_builder.close()

    meals_today = context.get("meals", [])

    # Load prompt template
    prompt_path = Path(__file__).parent.parent / "prompts" / "macro_coach.txt"
    with open(prompt_path) as f:
        prompt_template = f.read()

    # Substitute
    prompt = prompt_template.replace("{{meals_json}}", json.dumps(meals_today, indent=2))
    prompt = prompt.replace("{{targets_json}}", json.dumps(targets, indent=2))

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
            coaching = json.loads(response_text)
        except json.JSONDecodeError:
            coaching = {
                "protein_gap_g": 0,
                "suggestions": [],
                "warnings": [],
                "error": "Failed to parse agent response"
            }

        return coaching

    finally:
        await client.close()
