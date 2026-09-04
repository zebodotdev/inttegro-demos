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
