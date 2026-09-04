# Inttegro + Rails demo

**Kora Market** is a product-led Rails storefront with finish selection, an
accessible bag dialog, and truthful return states. Rails creates the physical
product order and keeps the Inttegro credential server-side.

```bash
bundle install
cp .env.example .env
set -a && source .env && set +a
bin/rails server --port 3006
```

Open <http://localhost:3006>. Run `bin/rails test` for the focused checks.
