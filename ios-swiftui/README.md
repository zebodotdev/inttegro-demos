# Inttegro SwiftUI demo

An iPhone-first example that imports the native **Inttegro SDK** through Swift
Package Manager and presents its SwiftUI payment sheet. It never embeds a
merchant API key.

The app intentionally uses the SDK's debug preview adapter. The public mobile
payment-session API and native transport are not available yet, so this demo
does not pretend to process a live payment. Replace the preview adapter with the
SDK's default transport when that contract ships; the presentation code stays
the same.

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

The app receives only a future short-lived `paymentSessionSecret` from a
merchant backend. Payment completion must still be verified on the server.
