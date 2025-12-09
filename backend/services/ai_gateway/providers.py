# Provider integration stubs. Uses httpx for outbound calls.
import httpx
from utils.ai_gateway.crypto import decrypt_secret
import logging

logger = logging.getLogger(__name__)

async def call_openai(api_key_encrypted: str, model: str, payload: dict):
    api_key = decrypt_secret(api_key_encrypted)
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Example: calling OpenAI chat completions (adjust endpoint per provider)
        resp = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()

async def forward_to_provider(provider_name: str, api_key_encrypted: str, model: str, payload: dict):
    # Dispatch to specific provider function
    if provider_name.lower() == "openai":
        return await call_openai(api_key_encrypted, model, payload)
    # Add anthropic / google stubs similarly
    raise NotImplementedError(f"Provider {provider_name} integration not implemented")
