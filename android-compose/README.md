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

## Deploy the companion backend

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-nextjs-v1.1.2&project-name=inttegro-demo-nextjs&repository-name=inttegro-demo-nextjs&env=INTTEGRO_API_KEY%2CINTTEGRO_DEMO_CUSTOMER_ID%2CINTTEGRO_DEMO_PUBLIC_URL&envDescription=Add%20an%20Inttegro%20test%20API%20key%2C%20test%20customer%20ID%2C%20and%20the%20public%20origin%20assigned%20to%20this%20deployment.&envLink=https%3A%2F%2Fstudio.inttegro.com%2Fkeys)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zebodotdev/inttegro-demos/tree/deploy-nextjs-v1.1.2)

These buttons create the Next.js companion service in your own account. Put its
public origin in `INTTEGRO_DEMO_BACKEND_URL`; the native app never receives the
server-held Inttegro API key. The buttons become live with release `v1.1.2`.

## Understand the integration

Start with
[`DemoBackend.kt`](./app/src/main/java/com/inttegro/demo/compose/DemoBackend.kt)
for the merchant-backend trust boundary, then read
[`MainActivity.kt`](./app/src/main/java/com/inttegro/demo/compose/MainActivity.kt)
for sheet presentation, telemetry, and result semantics. The `INTTEGRO:*`
comments map choices and alternatives to the shared
[integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
