# Inttegro Flutter demo

A Flutter app that asks a merchant backend for a short-lived payment session,
initializes `inttegro_flutter`, and presents the native Inttegro payment sheet.
The merchant API key never enters Dart code.

## Current release gate

The Dart integration and tests are complete. Device execution remains gated by
the unpublished Inttegro Flutter plugin registration and public mobile
payment-session API.

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

The backend must expose `POST /mobile/payment-sessions` and return
`{ "paymentSessionSecret": "..." }`. It owns `INTTEGRO_API_KEY` and builds the
fixed GHS 50.00 workshop order. A completed client result still requires
authoritative server-side verification.
