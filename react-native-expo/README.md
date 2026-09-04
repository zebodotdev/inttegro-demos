# Inttegro React Native + Expo demo

**Kora Market** is a tactile Expo storefront with category browsing, original
product imagery, finish selection, maker context, and a persistent checkout
bar. It asks a backend for a finalized checkout order, initializes
`@inttegro/react-native`, and presents the native Inttegro payment sheet.

## Current release gate

The TypeScript integration and app shell are complete. A device build remains
gated by the unpublished Inttegro native module and native Checkout transport.
Expo Go cannot load custom native modules; use an Expo development build once
the native adapters ship.

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
key and constructs the fixed GHS 50.00 Dawn Brew Set order. A completed client result
still requires authoritative server-side payment verification.
