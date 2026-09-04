# Inttegro Jetpack Compose demo

**Kora Market** is a Material 3 product experience with category chips, product
imagery, finish selection, fulfillment context, and a persistent checkout bar.
It consumes the local Inttegro SDK module and presents
`InttegroPaymentSheet` without embedding a merchant API key.

The example uses an explicitly named preview adapter because the native
Checkout transport is not available yet. Replace that adapter with the SDK
default when the transport ships; the UI integration stays the same.

## Run

Open this directory in Android Studio, let Gradle sync, choose an emulator, and
run the `app` configuration.

## Check

The repository includes a Gradle wrapper:

```sh
./gradlew :app:assembleDebug
```

A production app receives only a finalized `orderId` created by its backend.
Fulfillment still relies on authoritative server-side payment status.
