# Inttegro Jetpack Compose demo

**Kora Market** is a Material 3 product experience with category chips, product
imagery, finish selection, fulfillment context, and a persistent checkout bar.
It consumes the local Inttegro SDK module and presents
`InttegroPaymentSheet` without embedding a merchant API key.

The app asks the Kora Market backend for a finalized mobile-money-only order,
then uses the SDK's native Checkout transport. Payment-sheet telemetry is sent
to Logcat under `InttegroPaymentSheet` without installing an exporter.

## Run

Set `INTTEGRO_DEMO_BACKEND_URL` or the `inttegroDemoBackendUrl` Gradle property,
open this directory in Android Studio, let Gradle sync, choose an emulator, and
run the `app` configuration. Android Emulator reaches a local Next.js server at
`http://10.0.2.2:3000`.

## Check

The repository includes a Gradle wrapper:

```sh
./gradlew :app:assembleDebug
```

A production app receives only a finalized `orderId` created by its backend.
Fulfillment still relies on authoritative server-side payment status.
