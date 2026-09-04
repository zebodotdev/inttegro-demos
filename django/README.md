# Inttegro + Django demo

This Django application creates a finalized order with the Inttegro Python SDK
and redirects to hosted checkout.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
set -a && source .env && set +a
python manage.py runserver 3004
```

Run `python manage.py test` for the focused checks.
