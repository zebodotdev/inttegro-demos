# Inttegro + FastAPI demo

**Afterglow Sessions** pairs an editorial event page with an API-first FastAPI
backend. The visible courtyard ticket and the server-side Inttegro order share
the same product, price, and fulfillment story.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
set -a && source .env && set +a
uvicorn app.main:app --reload --port 3005
```

Open <http://localhost:3005>. Run `pytest` for the focused checks.
