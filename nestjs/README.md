# NestJS demo — Openfield

Openfield is a production-shaped community fundraiser built with NestJS and the
Inttegro TypeScript SDK. Its Riverbend campaign lets a supporter choose one of
three server-owned contribution tiers before continuing to Inttegro-hosted
Checkout inline, in a modal, or on its hosted page.

This is immediate flexible funding, not a delayed Kickstarter-style pledge.
The example neither promises tax deductibility nor treats the browser return as
evidence of payment.

## What it demonstrates

- a Nest controller that owns HTTP redirects and safe browser-visible errors
- a validated DTO boundary using `class-validator`
- an injected checkout service that keeps the Inttegro key server-side
- server-side Product and Price lookup before Order creation
- a bounded tier translated to a trusted quantity rather than a public amount
- a retry-stable idempotency key and readable merchant order number
- explicit completion and cancellation URLs
- a minimal JSON Order reference for embedded/modal Checkout and a resilient
  `303` hosted-page fallback

The extensive `INTTEGRO:*` comments in
[`src/checkout.service.ts`](./src/checkout.service.ts) document the selected
integration, security boundaries, and production alternatives. The controller
keeps framework concerns in [`src/campaign.controller.ts`](./src/campaign.controller.ts).

## Try the Checkout presentations

Choose a contribution tier, then choose **Embedded**, **Modal**, or **Hosted page**.
Embedded is the default. The first two receive only a no-store finalized
Order ID; hosted and no-JavaScript submissions receive a `303`. The shared
client boundary is
[`public/checkout-presentations.js`](./public/checkout-presentations.js).

## Configure the campaign Product

Create and publish a service Product named `Riverbend Learning Garden
contribution` with an active recurring-free Price of exactly **GHS 50**. The
three visible tiers multiply that trusted unit price by 1, 2, or 5 on the
server. A public request cannot choose an arbitrary amount or Product.

Copy `.env.example` to `.env` and set:

```dotenv
INTTEGRO_API_KEY=sk_test_replace_me
INTTEGRO_DEMO_PRODUCT_ID=prod_replace_me
INTTEGRO_DEMO_PRICE_ID=pr_replace_me
INTTEGRO_DEMO_PUBLIC_URL=http://localhost:3013
```

`INTTEGRO_API_KEY` must be a server secret. The public URL must be the exact
origin that receives `/complete` and `/cancel`; production applications should
allow-list it rather than infer it from arbitrary proxy headers.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:3013`. Run `npm run check` for the TypeScript build and
checkout contract tests.

## Run with Docker

```sh
docker compose up --build --wait
```

The container exposes `GET /health`. Use `docker compose down` when finished.

## Deploy your own

[![Deploy to Cloud Run](../assets/providers/cloud-run-button.svg)](https://deploy.cloud.run/?git_repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos.git&revision=deploy-nestjs-v1.7.0)
[![Run with Docker](../assets/providers/docker-button.svg)](#run-with-docker)
[![Deploy to Render](../assets/providers/render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-nestjs-v1.7.0)

Cloud Run and Render start from the immutable 1.7.0 deployment branch. Railway
configuration is also checked in, but its button remains unavailable until a
public template ID has been published and verified.

## Production boundaries

Openfield shows the checkout handoff, not a complete crowdfunding ledger. A
real platform should persist its own contribution attempt and idempotency key,
verify payment state through authenticated server events, reconcile missed
events, update campaign totals transactionally, and issue receipts from that
authoritative state. Add CSRF or strict origin protection, rate limits, and
abuse controls before accepting public traffic. Do not increment a public total
merely because a browser visited `/complete`.

See the repository-level [`INTEGRATION_GUIDE.md`](../INTEGRATION_GUIDE.md) and
[`integration-decisions.json`](../integration-decisions.json) for the shared
decision model.
