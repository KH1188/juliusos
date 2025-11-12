"""Skin coach recipe - safe routine recommendations."""
import json
from pathlib import Path
from datetime import datetime, timedelta
from ..core.ollama_client import OllamaClient
import httpx


async def run_skin_coach(user_id: int) -> dict:
    """Generate safe skin routine recommendations.

    Args:
        user_id: User ID

    Returns:
        Dict with routine steps and notes
    """
    # Get products and logs from API
    async with httpx.AsyncClient() as client:
        products_resp = await client.get("http://localhost:8000/skin/products?is_active=true")
        products = products_resp.json() if products_resp.status_code == 200 else []

        # Get last 7 days of logs
        start = (datetime.utcnow() - timedelta(days=7)).isoformat()
        logs_resp = await client.get(f"http://localhost:8000/skin/logs?start={start}")
        logs = logs_resp.json() if logs_resp.status_code == 200 else []

    # Load prompt template
    prompt_path = Path(__file__).parent.parent / "prompts" / "skin_coach.txt"
    with open(prompt_path) as f:
        prompt_template = f.read()

    # Substitute
    prompt = prompt_template.replace("{{products}}", json.dumps(products, indent=2))
    prompt = prompt.replace("{{logs_7d}}", json.dumps(logs, indent=2))

    # Call Ollama
    ollama_client = OllamaClient()
    try:
        result = await ollama_client.generate(
            prompt=prompt,
            temperature=0.3,
            format="json",
        )

        response_text = result.get("response", "{}")
        try:
            routine = json.loads(response_text)
        except json.JSONDecodeError:
            routine = {
                "routine": [],
                "notes": "Unable to generate recommendations. Please check your products and logs."
            }

        return routine

    finally:
        await ollama_client.close()
