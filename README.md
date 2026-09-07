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

Open <http://localhost:3005>. Configure `INTTEGRO_DEMO_PRODUCT_ID` and
`INTTEGRO_DEMO_PRICE_ID` with the active Afterglow admission Product and Price.
FastAPI resolves and validates both server-side; the reservation form supplies
no product or amount. Run `pytest` for the focused checks.

## Deploy your own

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos.git&revision=deploy-fastapi-v1.3.0)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/wk2B6a?utm_medium=integration&utm_source=inttegro-demos&utm_campaign=fastapi)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-fastapi-v1.3.0)

Cloud Run, Railway, and Render build the released Dockerfile. The Railway template is
pinned to this release's deployment branch and exact commit.
Cloudflare Python Workers is deliberately not offered yet: its outbound HTTP
path is asynchronous, while Inttegro Python SDK 6.0.0 currently uses synchronous
`urllib`. See [`DEPLOYING.md`](../DEPLOYING.md) for the compatibility decision.

## Understand the integration

Start with [`app/checkout.py`](./app/checkout.py) for the typed Order request and
safe error mapping, then read [`app/main.py`](./app/main.py) for the FastAPI
handoff and verification boundary. The `INTTEGRO:*` comments map choices and
alternatives to the shared [integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
