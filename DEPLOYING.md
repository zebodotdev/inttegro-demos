# Deploying Inttegro demos

Every deploy button is part of the demo's public contract. A button must point
to immutable released source, request only the environment values the app
actually consumes, and be exercised through a provider-owned preview before it
is marked verified.

[`deployments.json`](./deployments.json) is the machine-readable source of truth
for supported providers, intended `inttegro.dev` hosts, environment aliases,
configuration files, readiness, and known blockers. Documentation and the demo
catalogue derive their labels from it rather than guessing from the presence of
a provider logo.

## Reader experience

Every server demo offers four adjacent actions:

1. **Deploy this demo** opens a provider chooser and identifies the idiomatic
   target as Recommended.
2. **Run locally** opens that demo's setup instructions.
3. **View tagged source** opens the immutable per-demo release tag.
4. **Understand the integration** opens the commented SDK boundary and shared
   decision guide.

The provider flow must tell the reader which services will be created, which
values may cost money, and which variables they need before leaving Inttegro
documentation. A missing key is a setup state, not an application failure.

## Environment contract

All server demos require a dedicated `INTTEGRO_API_KEY`. Nuxt exposes the same
server-only value under `NUXT_INTTEGRO_API_KEY` because Nuxt runtime config uses
that prefix. Never add a browser-visible prefix such as `NEXT_PUBLIC_`,
`NUXT_PUBLIC_`, or `VITE_` to the API key. Prefer the narrowest key type your
account offers, dedicate it to the demo deployment, and rotate or revoke it
without affecting another workload.

`INTTEGRO_DEMO_PRODUCT_ID` and `INTTEGRO_DEMO_PRICE_ID` identify an active
Product and one active Price belonging to it. Nuxt uses
`NUXT_DEMO_PRODUCT_ID` and `NUXT_DEMO_PRICE_ID`. The server looks up the Product
at checkout, validates the configured pair, and supplies authoritative catalog
data to order creation. These IDs are configuration, not secrets, but they must
not be accepted from the public request because the customer cannot choose the
merchant's product or amount.

`INTTEGRO_DEMO_PUBLIC_URL` (or `NUXT_DEMO_PUBLIC_URL`) is the exact deployed
origin without a trailing slash. Requiring an explicit value avoids trusting an
attacker-controlled `Host` or forwarded-host header when the application builds
completion and cancellation URLs. Provider templates may ask for this value
after the provider assigns its initial hostname.

The Next.js companion backend also requires `INTTEGRO_DEMO_CUSTOMER_ID`, a
dedicated customer used to create the four native demos' finalized orders. It remains on
the server alongside the API key and is not required by the other web demos.

Framework-generated signing secrets such as `DJANGO_SECRET_KEY`,
`SECRET_KEY_BASE`, and `APP_KEY` belong to the reader's deployment and must be
generated there. They are never shared Inttegro credentials.

## Provider choices

- **Cloudflare Workers** is prepared for Next.js through OpenNext, for Nuxt
  through Nitro's Cloudflare preset, and for Express through Cloudflare's Node
  HTTP adapter. These variants preserve the framework's application and SDK
  boundary; the adapter exists only in the deployment entry point.
- **Vercel** is prepared for Next.js and Nuxt, where the platform can retain the
  framework-native build and routing model.
- **Render** uses a Dockerfile and per-demo Blueprint. The Blueprint disables
  automatic deploys so a reader's released example does not silently begin
  following upstream changes.
- **Railway** uses the same Dockerfile plus health and restart policy. Railway's
  visible button requires a published template ID, so it remains hidden until
  the template is created and smoke-tested in the Inttegro workspace.

Python Workers supports Django and FastAPI, but the current Inttegro Python SDK
uses a synchronous `urllib` transport. Cloudflare documents asynchronous HTTP
clients as the supported outbound path for Python Workers. Rewriting the demo to
bypass the official SDK would undermine its purpose, so Django and FastAPI use
containers on Render or Railway until the SDK provides a compatible transport.

Spring Boot remains remote-deployment gated until Java SDK 5.0.0 is public. The
Dockerfile and provider manifests are checked in so the gate can be removed and
verified without changing the integration example.

## Immutable deployment refs

Canonical source tags continue to point to one suite commit. Some providers
expect their configuration at repository root, so releases also publish one
generated subtree branch per deployable demo:

```text
deploy-nextjs-v1.1.3
deploy-express-v1.1.3
deploy-nuxt-v1.1.3
...
```

These branches are deployment artifacts, not canonical source references. Each
is created from the matching directory at the suite tag, records that source tag
in `INTTEGRO_DEMO_RELEASE.json`, includes the tagged repository license, rewrites
shared README links to their immutable suite-tag URLs, and is never force-updated
or reused. Studio permalinks continue to use the signed per-demo tag.

Run the branch preparation script only after the suite tag exists:

```sh
node scripts/prepare-deploy-refs.mjs v1.1.3
```

The script creates local branches but never pushes them. Inspect each branch,
push its exact name explicitly, protect it from force-pushes, and then register
the Railway templates.

## Verification gates

A provider changes from `prepared` to `verified` only after all of these pass:

1. Fresh deploy through the public button or template—not an existing internal
   project.
2. `GET /health` returns 200 and identifies the expected demo.
3. The home page, static assets, form validation, cancellation return, and
   missing-configuration state render correctly over HTTPS.
4. With a dedicated key and configured Product/Price pair, one checkout reaches the Inttegro-hosted URL and
   no key appears in HTML, JavaScript, redirect query strings, or provider logs.
5. The deployed release metadata matches the tag advertised by the catalogue.
6. The user can clone or eject the deployed source and modify it independently.

The public catalogue is `demos.inttegro.dev`; demo hosts use
`{demo-id}-demo.inttegro.dev`. The `inttegro.dev` zone is active on Cloudflare.
Custom-domain bindings are intentionally absent from the reader-facing Wrangler
files: Inttegro attaches them during release deployment, while every cloned demo
starts host-neutral in the reader's account.
