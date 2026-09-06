# Inttegro + Vue/Nuxt demo

**Kora Market** is a responsive Vue storefront with an interactive product
finish picker and accessible bag dialog. A Nitro server route creates the
Inttegro order; no secret is exposed through public runtime configuration.

```bash
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:3002>. Run `npm run check` for type checking and tests.

## Understand the integration

Start with [`server/utils/checkout.ts`](./server/utils/checkout.ts) for Order
construction and error mapping, then read
[`server/routes/checkout.post.ts`](./server/routes/checkout.post.ts) for cookie
correlation and the 303 handoff. The `INTTEGRO:*` comments map choices and
alternatives to the shared [integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
