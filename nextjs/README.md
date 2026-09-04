# Inttegro + Next.js demo

A minimal App Router application that creates an Inttegro order on the server
and redirects the customer to hosted checkout.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>. Keep `INTTEGRO_API_KEY` in the server environment;
do not prefix it with `NEXT_PUBLIC_`.

Run the checks with:

```bash
npm run check
```
