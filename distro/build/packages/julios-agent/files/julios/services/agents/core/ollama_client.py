"""Ollama client wrapper with retry logic and error handling."""
import httpx
from typing import Optional, Dict, Any, List
from tenacity import retry, stop_after_attempt, wait_exponential
from ..config import settings
import json


class OllamaClient:
    """Wrapper for Ollama API with retry and fallback logic."""

    def __init__(
        self,
        base_url: str = None,
        model: str = None,
        fallback_model: str = None,
    ):
        self.base_url = base_url or settings.ollama_url
        self.model = model or settings.ollama_model
        self.fallback_model = fallback_model or settings.ollama_fallback_model
        self.client = httpx.AsyncClient(timeout=120.0)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = None,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None,
        format: Optional[str] = None,  # "json" for JSON output
    ) -> Dict[str, Any]:
        """Generate completion from Ollama.

        Args:
            prompt: User prompt
            system: System prompt
            temperature: Sampling temperature (default from settings)
            max_tokens: Maximum tokens to generate
            model: Model override
            format: Output format ("json" for JSON mode)

        Returns:
            Dict with response and metadata
        """
        used_model = model or self.model
        temp = temperature if temperature is not None else settings.default_temperature

        payload = {
            "model": used_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temp,
            }
        }

        if system:
            payload["system"] = system

        if max_tokens:
            payload["options"]["num_predict"] = max_tokens

        if format == "json":
            payload["format"] = "json"

        try:
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            return {
                "response": data.get("response", ""),
                "model": data.get("model"),
                "done": data.get("done", True),
                "context": data.get("context"),
            }

        except httpx.HTTPError as e:
            # Try fallback model if available
            if self.fallback_model and used_model != self.fallback_model:
                payload["model"] = self.fallback_model
                try:
                    response = await self.client.post(
                        f"{self.base_url}/api/generate",
                        json=payload,
                    )
                    response.raise_for_status()
                    data = response.json()

                    return {
                        "response": data.get("response", ""),
                        "model": data.get("model"),
                        "done": data.get("done", True),
                        "context": data.get("context"),
                        "fallback": True,
                    }
                except httpx.HTTPError:
                    pass

            raise Exception(f"Ollama generation failed: {str(e)}")

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = None,
        model: Optional[str] = None,
        format: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Chat completion with message history.

        Args:
            messages: List of {role: "system"|"user"|"assistant", content: str}
            temperature: Sampling temperature
            model: Model override
            format: Output format ("json" for JSON mode)

        Returns:
            Dict with response and metadata
        """
        used_model = model or self.model
        temp = temperature if temperature is not None else settings.default_temperature

        payload = {
            "model": used_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temp,
            }
        }

        if format == "json":
            payload["format"] = "json"

        try:
            response = await self.client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            return {
                "message": data.get("message", {}),
                "response": data.get("message", {}).get("content", ""),
                "model": data.get("model"),
                "done": data.get("done", True),
            }

        except httpx.HTTPError as e:
            # Try fallback model
            if self.fallback_model and used_model != self.fallback_model:
                payload["model"] = self.fallback_model
                try:
                    response = await self.client.post(
                        f"{self.base_url}/api/chat",
                        json=payload,
                    )
                    response.raise_for_status()
                    data = response.json()

                    return {
                        "message": data.get("message", {}),
                        "response": data.get("message", {}).get("content", ""),
                        "model": data.get("model"),
                        "done": data.get("done", True),
                        "fallback": True,
                    }
                except httpx.HTTPError:
                    pass

            raise Exception(f"Ollama chat failed: {str(e)}")

    async def check_health(self) -> bool:
        """Check if Ollama is available."""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except httpx.HTTPError:
            return False

    async def list_models(self) -> List[str]:
        """List available models."""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
            return [model.get("name") for model in data.get("models", [])]
        except httpx.HTTPError:
            return []

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
