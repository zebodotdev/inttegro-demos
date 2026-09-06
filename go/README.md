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

## Deploy your own

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-go-v1.1.1)

Render builds a small distroless image from the released multi-stage
Dockerfile. Railway uses the same image and checked-in health policy; its button
follows after the public template is registered and smoke-tested. See
[`DEPLOYING.md`](../DEPLOYING.md).

## Understand the integration

[`main.go`](./main.go) keeps the complete integration deliberately visible:
input validation, Order construction, hosted URL selection, safe errors,
correlation, and the 303 handoff. Its `INTTEGRO:*` comments map choices and
alternatives to the shared [integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
