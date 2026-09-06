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

## Deploy your own

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-rails-v1.1.2)

Render builds the released Dockerfile with Puma. Railway uses the same image and
checked-in health policy; its button follows after the public template is
registered and smoke-tested. The deploy flow generates the framework signing
secret separately from `INTTEGRO_API_KEY`. See
[`DEPLOYING.md`](https://github.com/zebodotdev/inttegro-demos/blob/v1.1.2/DEPLOYING.md).

## Understand the integration

Start with
[`app/services/checkout_service.rb`](./app/services/checkout_service.rb) for
Order creation and safe error mapping, then read
[`app/controllers/checkouts_controller.rb`](./app/controllers/checkouts_controller.rb)
for the 303 handoff and correlation boundary. The `INTTEGRO:*` comments map
choices and alternatives to the shared
[integration guide](https://github.com/zebodotdev/inttegro-demos/blob/v1.1.2/INTEGRATION_GUIDE.md) and
[machine-readable decision registry](https://github.com/zebodotdev/inttegro-demos/blob/v1.1.2/integration-decisions.json).
