# Inttegro + Express demo

**Afterglow Sessions** is a cinematic event page with lineup, venue, and ticket
reservation states. Express validates the guest details, creates the finalized
ticket order, and redirects to the hosted checkout URL returned by Inttegro.

```bash
cp .env.example .env
npm install
set -a && source .env && set +a
npm run dev
```

Open <http://localhost:3001>. Configure `INTTEGRO_DEMO_PRODUCT_ID` and
`INTTEGRO_DEMO_PRICE_ID` with the active Afterglow admission Product and Price.
Express resolves and validates both on the server; the reservation form cannot
choose its own ticket or amount. Run `npm run check` to compile and execute the
focused unit tests.

## Run with Docker

After configuring `.env`, run `docker compose up --build --wait`. Compose
starts the production image at <http://localhost:3001> and monitors
`GET /health`. Use
`docker compose down` to stop it. Set `INTTEGRO_DEMO_PUBLIC_URL` to the exact
HTTPS origin before exposing the container publicly.

## Deploy your own

[![Run with Docker](https://raw.githubusercontent.com/zebodotdev/inttegro-demos/v1.4.0/assets/providers/docker-button.svg)](#run-with-docker)
[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos.git&revision=deploy-express-v1.4.0)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zebodotdev/inttegro-demos/tree/deploy-express-v1.4.0)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/MJF7nD?utm_medium=integration&utm_source=inttegro-demos&utm_campaign=express)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-express-v1.4.0)

Cloudflare uses a separate Node HTTP adapter entry point; the ordinary Express
application and Inttegro integration remain unchanged. Cloud Run, Railway, and
Render build the released Dockerfile. The deployment links target immutable
release branches. See [`DEPLOYING.md`](https://github.com/zebodotdev/inttegro-demos/blob/v1.4.0/DEPLOYING.md).

## Understand the integration

Start with [`src/checkout.ts`](./src/checkout.ts) for the finalized ticket Order
and hosted URL, then read [`src/app.ts`](./src/app.ts) for the HTTP handoff and
verification boundary. `src/server.ts` and `src/worker.ts` are intentionally
thin, provider-specific transport entry points. The `INTTEGRO:*` comments map
choices and alternatives to the shared [integration guide](https://github.com/zebodotdev/inttegro-demos/blob/v1.4.0/INTEGRATION_GUIDE.md)
and [machine-readable decision registry](https://github.com/zebodotdev/inttegro-demos/blob/v1.4.0/integration-decisions.json).
