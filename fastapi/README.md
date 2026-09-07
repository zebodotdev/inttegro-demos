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
uvicorn src.app.main:app --reload --port 3005
```

Open <http://localhost:3005>. Configure `INTTEGRO_DEMO_PRODUCT_ID` and
`INTTEGRO_DEMO_PRICE_ID` with the active Afterglow admission Product and Price.
FastAPI resolves and validates both server-side; the reservation form supplies
no product or amount. The request handler uses `AsyncInttegroClient`, awaits
both API calls, and reuses its HTTP connection pool across requests. Run
`pytest` for the focused checks.

## Run with Docker

After configuring `.env`, run `docker compose up --build --wait`. Compose
starts the production image at <http://localhost:3005> and monitors
`GET /health`. Use
`docker compose down` to stop it. Set `INTTEGRO_DEMO_PUBLIC_URL` to the exact
HTTPS origin before exposing the container publicly.

## Deploy your own

[![Deploy to Cloud Run](../assets/providers/cloud-run-button.svg)](https://deploy.cloud.run/?git_repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos.git&revision=deploy-fastapi-v1.4.1)
[![Run with Docker](../assets/providers/docker-button.svg)](#run-with-docker)
[![Deploy on Railway](../assets/providers/railway-button.svg)](https://railway.com/new/template/wk2B6a?utm_medium=integration&utm_source=inttegro-demos&utm_campaign=fastapi)
[![Deploy to Render](../assets/providers/render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-fastapi-v1.4.1)

Cloud Run, Railway, and Render build the released Dockerfile. The Railway
template is pinned to its release branch and exact commit. Cloudflare runs the
same FastAPI routes through its ASGI adapter and serves `/static/*` from Workers
Static Assets. It requires Inttegro Python SDK 6.3.0 or newer because the Worker
must await outbound HTTP. Use `uv run pywrangler dev` to exercise the Worker
runtime locally. Its one-click action is activated only after the SDK and the
immutable 1.5.0 deployment branch exist publicly. See
[`DEPLOYING.md`](../DEPLOYING.md) for provider details.

## Understand the integration

Start with [`src/app/checkout.py`](./src/app/checkout.py) for the typed Order request and
safe error mapping, then read [`src/app/main.py`](./src/app/main.py) for the FastAPI
handoff and verification boundary. The `INTTEGRO:*` comments map choices and
alternatives to the shared [integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
