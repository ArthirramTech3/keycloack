from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_user_by_api_key, get_db
from app.schemas import ChatRequest
from app.services.providers import forward_to_provider
from app.services.quotas import check_quota
from app.db import SessionLocal
from app import models
from app.utils.crypto import decrypt_secret
from sqlalchemy.orm import Session
import logging

router = APIRouter()

@router.post("/chat/completions")
async def proxy_chat(req: ChatRequest, user = Depends(get_user_by_api_key), db: Session = Depends(get_db)):
    # Validate provider allowed for user's org
    cfg = db.query(models.ProviderConfig).filter(models.ProviderConfig.organization_id == user.organization_id,
                                                 models.ProviderConfig.provider_name == req.provider).first()
    if not cfg:
        raise HTTPException(403, detail="Provider not configured for your organization")
    if req.model not in (cfg.allowed_models or []):
        raise HTTPException(403, detail="Model not allowed for your organization")
    
    api_key = decrypt_secret(cfg.encrypted_api_key)
    
    # Simple token estimate: use len of messages as proxy (replace with tokenizer)
    tokens_estimate = sum(len(m.get("content","")) for m in req.messages) // 4
    ok, used = check_quota(db, user, tokens_estimate)
    if not ok:
        raise HTTPException(status_code=429, detail="Monthly quota exceeded")
    # Build provider payload (normalize to OpenAI style)
    payload = {"model": req.model, "messages": req.messages}
    resp = await forward_to_provider(req.provider, api_key, req.model, payload)
    # Record usage (for exercise we assume provider returns usage)
    usage_in = tokens_estimate
    usage_out = resp.get("usage",{}).get("completion_tokens",0) if isinstance(resp, dict) else 0
    total = usage_in + usage_out
    log = models.UsageLog(user_id=user.id, organization_id=user.organization_id, provider=req.provider, model=req.model,
                          tokens_in=usage_in, tokens_out=usage_out, total_tokens=total)
    db.add(log); db.commit()
    return resp
