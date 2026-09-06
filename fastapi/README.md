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

## Deploy your own

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-fastapi-v1.1.0)

Render builds the released Dockerfile. Railway configuration is also ready; its
button follows after the public template is registered and smoke-tested.
Cloudflare Python Workers is deliberately not offered yet: its outbound HTTP
path is asynchronous, while Inttegro Python SDK 6.0.0 currently uses synchronous
`urllib`. See [`DEPLOYING.md`](../DEPLOYING.md) for the compatibility decision.

## Understand the integration

Start with [`app/checkout.py`](./app/checkout.py) for the typed Order request and
safe error mapping, then read [`app/main.py`](./app/main.py) for the FastAPI
handoff and verification boundary. The `INTTEGRO:*` comments map choices and
alternatives to the shared [integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
