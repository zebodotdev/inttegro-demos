# Inttegro + Go demo

An idiomatic `net/http` application that creates a finalized Inttegro order and
redirects to hosted checkout.

```bash
cp .env.example .env
set -a && source .env && set +a
go mod download
go run .
```

Open <http://localhost:3003>. Run `go test ./...` for the focused checks.
