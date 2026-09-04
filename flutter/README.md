# Inttegro Flutter demo

**Kora Market** is a Material 3 storefront with a collapsing product hero,
category and finish selection, fulfillment context, and a persistent checkout
bar. It asks a backend for a finalized checkout order, initializes
`inttegro_flutter`, and presents the native Inttegro payment sheet.

## Current release gate

The Dart integration and tests are complete. Device execution remains gated by
the unpublished Inttegro Flutter plugin registration and native Checkout
transport.

## Create platform shells, install, and check

This repository keeps generated Flutter platform shells out of the demo. Create
them once with your installed Flutter SDK:

```sh
flutter create --platforms=android,ios --project-name inttegro_demo_flutter .
flutter pub get
flutter analyze
flutter test
```

## Run

```sh
flutter run \
  --dart-define=INTTEGRO_DEMO_BACKEND_URL=http://localhost:3000
```

The backend must expose `POST /mobile/orders` and return
`{ "orderId": "or_..." }`. It owns `INTTEGRO_API_KEY` and builds the
fixed GHS 50.00 Dawn Brew Set order. A completed client result still requires
authoritative server-side verification.
