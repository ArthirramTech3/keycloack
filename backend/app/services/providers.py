import httpx

async def forward_to_provider(provider: str, api_key: str, model: str, payload: dict):
    # In a real scenario, you'd have different logic for each provider
    # and decrypt the api_key.
    # For this exercise, we'll use a mock response.
    return {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1677652288,
        "model": model,
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "This is a mock response from the AI provider.",
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 20,
            "total_tokens": 30
        }
    }
