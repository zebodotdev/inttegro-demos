# Inttegro + Spring Boot demo

**Ledgerline** is a responsive B2B invoice portal built with Spring MVC.
Customers review the service lines for INV-2048 before the Java SDK creates a
server-side service order and redirects to hosted checkout.

```bash
cd ../../sdks/java && mvn install -DskipTests && cd ../../demos/spring-boot
cp .env.example .env
set -a && source .env && set +a
mvn spring-boot:run
```

Open <http://localhost:3008>. Configure `INTTEGRO_DEMO_PRODUCT_ID` and
`INTTEGRO_DEMO_PRICE_ID` with the active Ledgerline retainer Product and Price.
Spring resolves and validates both before constructing the Order; the invoice
form cannot choose its own service or amount. Run `mvn test` for the focused
checks.

The first command is temporarily required because version `5.0.0` of the Java
SDK is documented but is not yet available from Maven Central. Once it is
published, consumers can remove that local-install step without changing the
demo code or dependency coordinate.

## Deploy your own

Render and Railway manifests plus a multi-stage Dockerfile are included, but no
public button is shown yet. A reader-owned remote build cannot resolve Inttegro
Java SDK 5.0.0 until that artifact is published. Publishing a button before that
gate clears would advertise a broken path. See
[`DEPLOYING.md`](https://github.com/zebodotdev/inttegro-demos/blob/v1.4.1/DEPLOYING.md) for the release gate.

## Understand the integration

Start with
[`CheckoutService.java`](./src/main/java/com/inttegro/demo/CheckoutService.java)
for the builder-based Order request and error boundary, then read
[`CheckoutController.java`](./src/main/java/com/inttegro/demo/CheckoutController.java)
for validation, correlation, and the 303 handoff. The `INTTEGRO:*` comments map
choices and alternatives to the shared
[integration guide](https://github.com/zebodotdev/inttegro-demos/blob/v1.4.1/INTEGRATION_GUIDE.md) and
[machine-readable decision registry](https://github.com/zebodotdev/inttegro-demos/blob/v1.4.1/integration-decisions.json).
