from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import httpx
import time
import json
from typing import Optional
from database import get_db


from utils.api_key_utils import validate_api_key, check_quota, get_allowed_models, log_usage
from config import OPENROUTER_BASE_URL

router = APIRouter()

async def get_api_key_from_header(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Extract and validate API key from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format. Use: Bearer <api_key>")
    
    api_key = authorization[7:]  # Remove "Bearer " prefix
    
    key_obj = validate_api_key(db, api_key)
    if not key_obj:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    
    return key_obj

@router.post("/chat/completions")
async def chat_completions(
    request: Request,
    db: Session = Depends(get_db),
    api_key = Depends(get_api_key_from_header)
):
    """
    Proxy chat completion requests to OpenRouter.
    Validates API key, checks quotas, enforces model restrictions, and logs usage.
    """
    start_time = time.time()
    
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    
    model = body.get("model")
    if not model:
        raise HTTPException(status_code=400, detail="Model is required")
    
    # Check if model is allowed
    allowed_models = get_allowed_models(db, api_key)
    if allowed_models and model not in allowed_models:
        raise HTTPException(
            status_code=403,
            detail=f"Model '{model}' is not allowed for this API key. Allowed models: {allowed_models}"
        )
    
    # Check quota
    quota_check = check_quota(api_key)
    if not quota_check["allowed"]:
        raise HTTPException(
            status_code=429,
            detail=quota_check["reason"]
        )
    
    # Get organization's OpenRouter API key
    openrouter_key = api_key.organization.openrouter_api_key
    
    # Check if streaming is requested
    is_streaming = body.get("stream", False)
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://api-gateway.local",
                    "X-Title": "API Gateway"
                },
                json=body,
                timeout=120.0
            )
            
            response_time_ms = int((time.time() - start_time) * 1000)
            
            if is_streaming:
                # For streaming, return the response directly
                async def stream_generator():
                    total_tokens = 0
                    async for chunk in response.aiter_bytes():
                        yield chunk
                        # Try to parse token usage from stream
                        try:
                            chunk_str = chunk.decode('utf-8')
                            for line in chunk_str.split('\n'):
                                if line.startswith('data: ') and line != 'data: [DONE]':
                                    data = json.loads(line[6:])
                                    if 'usage' in data:
                                        total_tokens = data['usage'].get('total_tokens', 0)
                        except:
                            pass
                    
                    # Log usage after streaming completes
                    log_usage(
                        db=db,
                        api_key=api_key,
                        model_id=model,
                        prompt_tokens=0,
                        completion_tokens=total_tokens,
                        response_time_ms=response_time_ms,
                        status_code=response.status_code
                    )
                
                return StreamingResponse(
                    stream_generator(),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive"
                    }
                )
            else:
                # Non-streaming response
                response_data = response.json()
                
                # Extract usage data
                usage = response_data.get("usage", {})
                prompt_tokens = usage.get("prompt_tokens", 0)
                completion_tokens = usage.get("completion_tokens", 0)
                
                # Log usage
                log_usage(
                    db=db,
                    api_key=api_key,
                    model_id=model,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    response_time_ms=response_time_ms,
                    status_code=response.status_code
                )
                
                return response_data
                
    except httpx.TimeoutException:
        log_usage(
            db=db,
            api_key=api_key,
            model_id=model,
            prompt_tokens=0,
            completion_tokens=0,
            response_time_ms=int((time.time() - start_time) * 1000),
            status_code=504,
            error_message="Request timeout"
        )
        raise HTTPException(status_code=504, detail="Request to AI provider timed out")
    except httpx.RequestError as e:
        log_usage(
            db=db,
            api_key=api_key,
            model_id=model,
            prompt_tokens=0,
            completion_tokens=0,
            response_time_ms=int((time.time() - start_time) * 1000),
            status_code=502,
            error_message=str(e)
        )
        raise HTTPException(status_code=502, detail=f"Error connecting to AI provider: {str(e)}")

@router.get("/models")
async def list_models(
    db: Session = Depends(get_db),
    api_key = Depends(get_api_key_from_header)
):
    """List models available to this API key."""
    allowed_models = get_allowed_models(db, api_key)
    
    if not allowed_models:
        # Return all available models from OpenRouter
        openrouter_key = api_key.organization.openrouter_api_key
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{OPENROUTER_BASE_URL}/models",
                headers={"Authorization": f"Bearer {openrouter_key}"}
            )
            
            if response.status_code == 200:
                return response.json()
            return {"data": []}
    
    # Return only allowed models
    return {
        "data": [{"id": model_id} for model_id in allowed_models]
    }

@router.get("/usage")
async def get_my_usage(
    db: Session = Depends(get_db),
    api_key = Depends(get_api_key_from_header)
):
    """Get usage statistics for the current API key."""
    quota_info = check_quota(api_key)
    allowed_models = get_allowed_models(db, api_key)
    
    return {
        "tokens_used_today": api_key.tokens_used_today,
        "tokens_used_month": api_key.tokens_used_month,
        "daily_token_limit": api_key.daily_token_limit,
        "monthly_token_limit": api_key.monthly_token_limit,
        "daily_remaining": (api_key.daily_token_limit - api_key.tokens_used_today) if api_key.daily_token_limit else None,
        "monthly_remaining": (api_key.monthly_token_limit - api_key.tokens_used_month) if api_key.monthly_token_limit else None,
        "allowed_models": allowed_models
    }
