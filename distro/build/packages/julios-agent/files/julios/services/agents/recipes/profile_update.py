"""Profile update recipe - asks intelligent questions to learn about user."""
import json
from pathlib import Path
from datetime import datetime
from ..core.ollama_client import OllamaClient
from ..core.context_builder import ContextBuilder
import httpx


async def run_profile_update(user_id: int) -> dict:
    """Ask one valuable question to improve user profile.

    Args:
        user_id: User ID

    Returns:
        Dict with question or skip signal
    """
    # Check questions asked today
    async with httpx.AsyncClient() as client:
        # Get current profile
        profile_resp = await client.get(f"http://localhost:8000/profile")
        profile_data = profile_resp.json() if profile_resp.status_code == 200 else {"profile_json": {}}

    # Build today's context
    context_builder = ContextBuilder()
    context = await context_builder.build_context(
        user_id=user_id,
        window_days=1,
        include_modules=["tasks", "events", "habits", "meals", "goals"]
    )
    await context_builder.close()

    # Load prompt template
    prompt_path = Path(__file__).parent.parent / "prompts" / "profile_update.txt"
    with open(prompt_path) as f:
        prompt_template = f.read()

    # Substitute
    prompt = prompt_template.replace("{{profile_snapshot}}", json.dumps(profile_data.get("profile_json", {}), indent=2))
    prompt = prompt.replace("{{today_context}}", json.dumps(context, indent=2))

    # Call Ollama
    client = OllamaClient()
    try:
        result = await client.generate(
            prompt=prompt,
            temperature=0.4,
            format="json",
        )

        response_text = result.get("response", "{}")
        try:
            question_result = json.loads(response_text)
        except json.JSONDecodeError:
            question_result = {"skip": True, "reason": "Failed to parse response"}

        return question_result

    finally:
        await client.close()
