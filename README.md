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

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-nextjs-v1.1.3&project-name=inttegro-demo-nextjs&repository-name=inttegro-demo-nextjs&env=INTTEGRO_API_KEY%2CINTTEGRO_DEMO_CUSTOMER_ID%2CINTTEGRO_DEMO_PUBLIC_URL&envDescription=Add%20an%20Inttegro%20test%20API%20key%20and%20the%20public%20origin%20assigned%20to%20this%20deployment.&envLink=https%3A%2F%2Fstudio.inttegro.com%2Fkeys)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zebodotdev/inttegro-demos/tree/deploy-nextjs-v1.1.3)

Vercel is the idiomatic target; Cloudflare uses the checked-in OpenNext adapter
to preserve the App Router and route handlers. Both flows clone an immutable
deployment ref derived from the tagged source and ask for your own test
credentials. The buttons become live when release `nextjs-v1.1.3` is published. See
[`DEPLOYING.md`](../DEPLOYING.md) for the security contract and verification
status.

## Understand the integration

Start with [`lib/checkout.ts`](./lib/checkout.ts) for the hosted and native Order
requests, then read [`app/checkout/route.ts`](./app/checkout/route.ts) for the
303 browser handoff and
[`app/mobile/orders/route.ts`](./app/mobile/orders/route.ts) for the mobile trust
boundary. Source comments link each consequential choice to the shared
[integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
