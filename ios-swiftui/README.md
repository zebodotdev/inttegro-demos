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
