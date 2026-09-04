# Mobile demo boundary

The four mobile demos integrate with the **Inttegro SDK**. SwiftUI and Jetpack
Compose consume the native SDK directly; Flutter and React Native remain thin
facades over those same native surfaces.

For now, their dependency declarations resolve the unreleased SDKs at
`../sdks/`, so check out this repository as the Commerce repository's `demos/`
submodule before building a mobile app. Those local paths will be replaced by
published package coordinates as each SDK becomes available.

## Merchant backend contract

Mobile code never calls the merchant API with `INTTEGRO_API_KEY`. It asks its
own backend to create and finalize an immutable checkout order:

```http
POST /mobile/orders
Content-Type: application/json

{
  "attemptId": "mobile_01J..."
}
```

The successful response contains only the finalized order ID:

```json
{ "orderId": "or_..." }
```

The backend determines the authoritative account, customer, amount, currency,
line items, and supported payment methods. The Next.js demo implements this
route and creates a finalized GHS 50.00 order with
`payment_method_types: ["mobile_money"]`. It derives the idempotency key from
the client-generated attempt ID and returns no customer or credential data.

Configure that backend with both `INTTEGRO_API_KEY` and the server-owned
`INTTEGRO_DEMO_CUSTOMER_ID`. The public checkout capability lets the SDK inspect
and attempt payment for the immutable order, while fulfillment still waits for
authoritative server-side verification.

## Native execution

All four apps now use the SDK's native Checkout transport. SwiftUI and Compose
consume it directly; the React Native and Flutter apps call the same native
implementations through their registered bridges. Expo must run as a
development build, and Flutter platform shells are generated locally as
documented in that demo.

The mobile SDK does not advertise or render card, Apple Pay, or Google Pay.
An attached unsupported payment method fails with
`unsupported_payment_method`. No demo invents a merchant credential,
secret-bearing client token, or false success response.

## Host telemetry

Each app connects the privacy-safe payment-sheet event stream to a host-owned
sink and cleans it up with the host lifecycle:

| App | Host sink | Lifecycle boundary |
| --- | --- | --- |
| SwiftUI | Unified logging | Event handler owned by the presented sheet |
| Compose | Logcat | Remembered telemetry source for the screen |
| React Native | `console.info` | Effect subscription cleanup |
| Flutter | `debugPrint` | Stream subscription canceled in `dispose` |

The demos log the random flow ID, event name, sequence, operation, HTTP status,
bounded gateway request ID, and safe error type. They do not log checkout
payloads, customer fields, payment credentials, or mobile-money account
numbers.

## Device verification

Before a mobile SDK release, run the same journey on an iPhone simulator or
device and an Android emulator or device, directly and through both
cross-platform bridges:

1. Enable VoiceOver or TalkBack and confirm the product actions, payment-method
   choices, fields, close control, and pay action have useful labels and focus
   order.
2. Increase the platform text size and confirm the medium and large sheet
   detents remain usable without clipped controls.
3. Open, drag, dismiss, and reopen the sheet; rotate Android while it is open;
   and background then foreground the app during an authorization wait.
4. Confirm a second tap cannot create a concurrent order, a canceled sheet is
   reported once, and terminal telemetry is emitted once.
5. Repeat with the backend offline and with an unsupported attached method;
   confirm the app shows a safe failure and logs no private payload.
