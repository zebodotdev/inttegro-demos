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
  "item": {
    "name": "Dawn Brew Set",
    "type": "physical",
    "quantity": 1,
    "currency": "GHS",
    "value": 5000
  }
}
```

The successful response contains only the finalized order ID:

```json
{ "orderId": "or_..." }
```

The backend determines the authoritative account, customer, amount, currency,
and line items. The public checkout capability lets the SDK inspect and attempt
payment for that immutable order, while fulfillment still waits for
authoritative server-side verification.

## Current gate

The native Checkout transport and Flutter and React Native registrations are
not published yet. Consequently:

- SwiftUI and Compose use explicit preview adapters and are compiled as native
  apps without claiming to process money.
- Flutter and React Native show the real client-side integration and backend
  boundary, but device execution waits for native plugin registration.
- No demo invents a merchant credential, secret-bearing client token, or
  false success response.

When the native transport ships, the preview adapters can be removed without
changing the application-level presentation flow.
