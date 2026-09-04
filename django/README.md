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
