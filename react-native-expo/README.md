# Inttegro React Native + Expo demo

**Kora Market** is a tactile Expo storefront with category browsing, original
product imagery, finish selection, maker context, and a persistent checkout
bar. It asks a backend for a finalized checkout order, initializes
`@inttegro/react-native`, and presents the native Inttegro payment sheet.

The app uses the native Checkout transport and subscribes to privacy-safe SDK
telemetry for the lifetime of the React component. Expo Go cannot load custom
native modules, so run it as an Expo development build.

## Install and check

```sh
cp .env.example .env
npm install
npm test
```

## Run

```sh
npm run ios
# or
npm run android
```

The configured demo backend must expose `POST /mobile/orders` and return
`{ "orderId": "or_..." }`. That backend owns the merchant API
key and constructs the fixed GHS 50.00 Dawn Brew Set order. A completed client
result still requires authoritative server-side payment verification.

## Understand the integration

Start with [`src/demoBackend.ts`](./src/demoBackend.ts) for the merchant-backend
trust boundary, then read [`App.tsx`](./App.tsx) for sheet initialization,
presentation, telemetry, and result semantics. The `INTTEGRO:*` comments map
choices and alternatives to the shared [integration guide](../INTEGRATION_GUIDE.md)
and [machine-readable decision registry](../integration-decisions.json).
