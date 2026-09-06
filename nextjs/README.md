# Inttegro + Next.js demo

**Kora Market** is a responsive App Router storefront for the Dawn Brew Set. It
combines product discovery, finish selection, an accessible bag dialog, and a
server-only Inttegro order handoff to hosted checkout.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>. Keep `INTTEGRO_API_KEY` in the server environment;
do not prefix it with `NEXT_PUBLIC_`. The server also exposes
`POST /mobile/orders` for the four mobile demos; set the server-owned
`INTTEGRO_DEMO_CUSTOMER_ID` before using that route.

Run the checks with:

```bash
npm run check
```

## Understand the integration

Start with [`lib/checkout.ts`](./lib/checkout.ts) for the hosted and native Order
requests, then read [`app/checkout/route.ts`](./app/checkout/route.ts) for the
303 browser handoff and
[`app/mobile/orders/route.ts`](./app/mobile/orders/route.ts) for the mobile trust
boundary. Source comments link each consequential choice to the shared
[integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
