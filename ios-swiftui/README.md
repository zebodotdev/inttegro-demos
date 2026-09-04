# Inttegro SwiftUI demo

**Kora Market** is an iPhone-first product experience with category browsing,
product imagery, finish selection, fulfillment context, and a persistent native
checkout bar. It imports **Inttegro SDK** through Swift Package Manager and
presents the SDK's SwiftUI payment sheet without embedding a merchant API key.

The app intentionally uses the SDK's debug preview adapter because the native
Checkout transport is not available yet, so this demo does not pretend to
process a live payment. Replace the preview adapter with the SDK's default
transport when it ships; the presentation code stays the same.

## Run

Requirements: Xcode 16 or newer and XcodeGen 2.44 or newer.

```sh
xcodegen generate
open InttegroSwiftUIDemo.xcodeproj
```

Choose an iPhone simulator and run the `InttegroSwiftUIDemo` scheme.

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
