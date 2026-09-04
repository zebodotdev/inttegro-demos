# Inttegro demo applications

This directory contains small, production-shaped applications that demonstrate
how to integrate Inttegro using the conventions of each ecosystem. Server demos
implement the same hosted-checkout journey. Mobile demos exercise the Inttegro
SDK boundary without ever receiving a merchant API key.

The repository is designed to live at `demos/` in the Commerce checkout. The
web and server examples can also be cloned and run independently. Until the
mobile SDKs and Java SDK 5.0.0 are published, the SwiftUI, Compose, Flutter,
React Native, and Spring Boot examples resolve those SDKs from the parent
Commerce checkout.

## Release plan

### V1

| Demo | SDK | Status |
| --- | --- | --- |
| Next.js + TypeScript | TypeScript | Implemented and verified |
| Express + TypeScript | TypeScript | Implemented and verified |
| Vue + Nuxt | TypeScript | Implemented and verified |
| Go | Go | Implemented and verified |
| Django + Python | Python | Implemented and verified |
| FastAPI + Python | Python | Implemented and verified |
| Rails + Ruby | Ruby | Implemented and verified |
| Laravel + PHP | PHP | Implemented and verified |
| Spring Boot + Java | Java | Implemented; SDK publication gated |
| iOS + SwiftUI | Inttegro SDK | Implemented with preview transport |
| Android + Jetpack Compose | Inttegro SDK | Implemented with preview transport |
| Flutter | Inttegro Flutter | App integration ready; native plugin gated |
| React Native + Expo | Inttegro React Native | App integration ready; native module gated |

### V2

ASP.NET Core, NestJS, React + Vite, Angular, and SvelteKit follow after the V1
contract and verification suite are stable.

## Shared journey

Each V1 demo:

1. Collects a small customer and cart payload.
2. Creates and finalizes an order through an official Inttegro SDK.
3. Supplies explicit completion and cancellation URLs.
4. Redirects the browser to the hosted checkout URL returned by Inttegro.
5. Explains that the browser return is not authoritative fulfillment evidence.
6. Handles configuration, validation, and Inttegro API failures without leaking
   credentials or raw internal errors.

See [CONTRACT.md](./CONTRACT.md) for the normative acceptance contract.
See [MOBILE.md](./MOBILE.md) for the mobile backend boundary and release gates.

## Configuration

Server demos use these environment variables:

```dotenv
INTTEGRO_API_KEY=sk_test_replace_me
INTTEGRO_DEMO_PUBLIC_URL=http://localhost:3000
```

`INTTEGRO_API_KEY` must never be exposed to browser or mobile code.
`INTTEGRO_DEMO_PUBLIC_URL` is the externally reachable origin used for checkout
completion and cancellation URLs. Each demo documents its own default port.

## Supporting assets

The cURL examples, Postman collection, shared fixtures, and automated contract
checks are supporting assets rather than separate demo applications.

Run the dependency-free suite check from this repository's root:

```sh
node scripts/check.mjs
```
