# Inttegro Flutter demo

**Kora Market** is a Material 3 storefront with a collapsing product hero,
category and finish selection, fulfillment context, and a persistent checkout
bar. It asks a backend for a finalized checkout order, initializes
`inttegro_flutter`, and presents the native Inttegro payment sheet.

The app uses the native Checkout transport and keeps a privacy-safe telemetry
subscription for the lifetime of the product screen. The repository keeps the
generated platform shells out of source control, so create them locally before
the first device run.

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

## Understand the integration

Start with [`lib/demo_backend.dart`](./lib/demo_backend.dart) for the
merchant-backend trust boundary, then read [`lib/main.dart`](./lib/main.dart)
for sheet initialization, presentation, telemetry, and result semantics. The
`INTTEGRO:*` comments map choices and alternatives to the shared
[integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
