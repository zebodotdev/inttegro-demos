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

Open <http://localhost:3001>. Run `npm run check` to compile and execute the
focused unit tests.

## Understand the integration

Start with [`src/checkout.ts`](./src/checkout.ts) for the finalized ticket Order
and hosted URL, then read [`src/server.ts`](./src/server.ts) for the HTTP
handoff and verification boundary. The `INTTEGRO:*` comments map choices and
alternatives to the shared [integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
