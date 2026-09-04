# Inttegro React Native + Expo demo

An Expo development-build example that asks a merchant backend for a
short-lived payment session, initializes `@inttegro/react-native`, and presents
the native Inttegro payment sheet. `INTTEGRO_API_KEY` is never included in the
app or in an `EXPO_PUBLIC_` variable.

## Current release gate

The TypeScript integration and app shell are complete. A device build remains
gated by the unpublished Inttegro native module and public payment-session API.
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

The configured demo backend must expose `POST /mobile/payment-sessions` and
return `{ "paymentSessionSecret": "..." }`. That backend owns the merchant API
key and constructs the fixed GHS 50.00 workshop order. A completed client result
still requires authoritative server-side payment verification.
