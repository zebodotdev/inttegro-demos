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

## Understand the integration

Start with
[`app/services/checkout_service.rb`](./app/services/checkout_service.rb) for
Order creation and safe error mapping, then read
[`app/controllers/checkouts_controller.rb`](./app/controllers/checkouts_controller.rb)
for the 303 handoff and correlation boundary. The `INTTEGRO:*` comments map
choices and alternatives to the shared
[integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
