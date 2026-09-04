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

Open <http://localhost:3008>. Run `mvn test` for the focused checks.

The first command is temporarily required because version `5.0.0` of the Java
SDK is documented but is not yet available from Maven Central. Once it is
published, consumers can remove that local-install step without changing the
demo code or dependency coordinate.
