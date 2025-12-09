# AI Gateway - FastAPI Backend
Production-ready scaffold for an AI provider gateway/proxy.
Run with:
```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
See .env.example for required environment variables.