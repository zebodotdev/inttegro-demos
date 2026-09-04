# Inttegro + Spring Boot demo

A Spring MVC application that creates a finalized order through the official
Inttegro Java SDK and redirects to hosted checkout.

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
