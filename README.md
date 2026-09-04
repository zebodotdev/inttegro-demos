# Inttegro + FastAPI demo

An API-first Python application using FastAPI and the official Inttegro SDK.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
set -a && source .env && set +a
uvicorn app.main:app --reload --port 3005
```

Open <http://localhost:3005>. Run `pytest` for the focused checks.
