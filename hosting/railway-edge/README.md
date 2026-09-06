# Railway demo edge

This Cloudflare Worker gives the container-hosted demos stable Inttegro origins
while Railway remains the application runtime. It accepts only the five listed
first-party hostnames, forwards the original request to the matching Railway
service, preserves HTTPS proxy metadata, and rewrites an upstream-local redirect
back to the public origin.

Deploy from this directory with an authenticated Wrangler session:

```sh
npx wrangler@latest deploy
```

The Railway services must set `INTTEGRO_DEMO_PUBLIC_URL` to their matching
`https://{framework}-demo.inttegro.dev` origin. Django must additionally trust
that origin through `DJANGO_CSRF_TRUSTED_ORIGINS`.
