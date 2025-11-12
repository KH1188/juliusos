"""Bible reflection recipe."""
import json
from pathlib import Path
from ..core.ollama_client import OllamaClient
from ..core.context_builder import ContextBuilder
from ..config import settings


async def run_bible_reflector(user_id: int, passage: str) -> dict:
    """Generate Bible reflection for passage.

    Args:
        user_id: User ID
        passage: Bible passage reference (e.g., "John 3:1-21")

    Returns:
        Dict with summary, three_questions, prayer_points
    """
    # Get recent reflections for context
    context_builder = ContextBuilder()
    context = await context_builder.build_context(
        user_id=user_id,
        window_days=30,
        include_modules=["bible"]
    )
    await context_builder.close()

    recent_reflections = context.get("recent_readings", [])[:5]

    # Load prompt template
    prompt_path = Path(__file__).parent.parent / "prompts" / "bible_reflector.txt"
    with open(prompt_path) as f:
        prompt_template = f.read()

    # Substitute
    prompt = prompt_template.replace("{{passage}}", passage)
    prompt = prompt.replace("{{recent_reflections}}", json.dumps(recent_reflections, indent=2))

    # Call Ollama with creative temperature
    client = OllamaClient()
    try:
        result = await client.generate(
            prompt=prompt,
            temperature=settings.creative_temperature,
            format="json",
        )

        response_text = result.get("response", "{}")
        try:
            reflection = json.loads(response_text)
        except json.JSONDecodeError:
            reflection = {
                "summary": "Unable to generate summary",
                "three_questions": [],
                "prayer_points": [],
                "error": "Failed to parse agent response"
            }

        return reflection

    finally:
        await client.close()
