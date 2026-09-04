# Inttegro + Rails demo

A small Rails application that creates a finalized Inttegro order and redirects
to hosted checkout.

```bash
bundle install
cp .env.example .env
set -a && source .env && set +a
bin/rails server --port 3006
```

Open <http://localhost:3006>. Run `bin/rails test` for the focused checks.
