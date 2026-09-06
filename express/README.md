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

## Deploy your own

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zebodotdev/inttegro-demos/tree/deploy-express-v1.2.3)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-express-v1.2.3)

Cloudflare uses a separate Node HTTP adapter entry point; the ordinary Express
application and Inttegro integration remain unchanged. Render builds the
released Dockerfile. Railway configuration is included, and its button will be
added after the public template is registered and smoke-tested. See
[`DEPLOYING.md`](../DEPLOYING.md).

## Understand the integration

Start with [`src/checkout.ts`](./src/checkout.ts) for the finalized ticket Order
and hosted URL, then read [`src/app.ts`](./src/app.ts) for the HTTP handoff and
verification boundary. `src/server.ts` and `src/worker.ts` are intentionally
thin, provider-specific transport entry points. The `INTTEGRO:*` comments map
choices and alternatives to the shared [integration guide](../INTEGRATION_GUIDE.md)
and [machine-readable decision registry](../integration-decisions.json).
