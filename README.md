# Inttegro + Go demo

**Ledgerline** is a polished client invoice portal built on idiomatic
`net/http`. Customers review service lines and settle INV-2048 through an
Inttegro-hosted checkout created entirely on the server.

```bash
cp .env.example .env
set -a && source .env && set +a
go mod download
go run .
```

Open <http://localhost:3003>. Run `go test ./...` for the focused checks.
