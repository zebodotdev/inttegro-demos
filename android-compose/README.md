# Inttegro Jetpack Compose demo

A native Android app that consumes the local Inttegro SDK module and presents
`InttegroPaymentSheet` from a Compose screen. It never embeds a merchant API key.

The example uses an explicitly named preview adapter because the public mobile
payment-session API and native transport are not available yet. Replace that
adapter with the SDK default when the transport ships; the UI integration stays
the same.

## Run

Open this directory in Android Studio, let Gradle sync, choose an emulator, and
run the `app` configuration.

## Check

The repository includes a Gradle wrapper:

```sh
./gradlew :app:assembleDebug
```

The only credential a production app receives is a short-lived
`paymentSessionSecret` created by its backend. Fulfillment still relies on
authoritative server-side payment status.
