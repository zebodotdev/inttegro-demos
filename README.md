# Inttegro + Django demo

**Afterglow Sessions** is an event-discovery and ticket-reservation experience.
Django validates the guest details, creates a finalized digital ticket order
with the Inttegro Python SDK, and redirects to hosted checkout.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
set -a && source .env && set +a
python manage.py runserver 3004
```

Run `python manage.py test` for the focused checks.

## Deploy your own

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-django-v1.1.0)

Render builds the released Dockerfile. Railway configuration is also ready; its
button follows after the public template is registered and smoke-tested.
Cloudflare Python Workers is deliberately not offered yet: Python Workers
requires an asynchronous outbound HTTP path, while Inttegro Python SDK 6.0.0
currently uses synchronous `urllib`. See [`DEPLOYING.md`](../DEPLOYING.md) for
the compatibility decision.

## Understand the integration

Start with [`checkout/service.py`](./checkout/service.py) for the typed Order
request and safe error mapping, then read
[`checkout/views.py`](./checkout/views.py) for the 303 handoff and correlation
boundary. The `INTTEGRO:*` comments map choices and alternatives to the shared
[integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
