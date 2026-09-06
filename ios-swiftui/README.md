# Inttegro SwiftUI demo

**Kora Market** is an iPhone-first product experience with category browsing,
product imagery, finish selection, fulfillment context, and a persistent native
checkout bar. It imports **Inttegro SDK** through Swift Package Manager and
presents the SDK's SwiftUI payment sheet without embedding a merchant API key.

The app asks the Kora Market backend for a finalized mobile-money-only order,
then uses the SDK's native Checkout transport. Payment-sheet telemetry is sent
to the host app's unified logging category without installing an exporter.

## Run

Requirements: Xcode 16 or newer and XcodeGen 2.44 or newer.

```sh
xcodegen generate
open InttegroSwiftUIDemo.xcodeproj
```

Set `INTTEGRO_DEMO_BACKEND_URL` in the scheme environment to the reachable
Next.js demo origin, then choose an iPhone simulator and run the
`InttegroSwiftUIDemo` scheme. For the simulator, `http://127.0.0.1:3000` is a
typical local value.

## Check

```sh
xcodegen generate
xcodebuild build \
  -project InttegroSwiftUIDemo.xcodeproj \
  -scheme InttegroSwiftUIDemo \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  CODE_SIGNING_ALLOWED=NO
```

A production app receives only a finalized `orderID` from its merchant backend.
Payment completion must still be verified on the server.

## Deploy the companion backend

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-nextjs-v1.2.2&project-name=inttegro-demo-nextjs&repository-name=inttegro-demo-nextjs&env=INTTEGRO_API_KEY%2CINTTEGRO_DEMO_PRODUCT_ID%2CINTTEGRO_DEMO_PRICE_ID%2CINTTEGRO_DEMO_CUSTOMER_ID%2CINTTEGRO_DEMO_PUBLIC_URL&envDescription=Add%20a%20dedicated%20Inttegro%20API%20key%2C%20active%20Product%20and%20Price%20IDs%2C%20demo%20Customer%20ID%2C%20and%20the%20public%20origin.&envLink=https%3A%2F%2Fstudio.inttegro.com%2Fkeys)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zebodotdev/inttegro-demos/tree/deploy-nextjs-v1.2.2)

These buttons create the Next.js companion service in your own account. Put its
public origin in `INTTEGRO_DEMO_BACKEND_URL`; the native app never receives the
server-held Inttegro API key. The buttons become live with release `v1.2.2`.

## Understand the integration

Start with [`DemoBackend.swift`](./InttegroSwiftUIDemo/DemoBackend.swift) for the
merchant-backend trust boundary, then read
[`CheckoutView.swift`](./InttegroSwiftUIDemo/CheckoutView.swift) for payment
sheet configuration, presentation, telemetry, and result semantics. The
`INTTEGRO:*` comments map choices and alternatives to the shared
[integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
