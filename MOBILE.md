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
own backend to create a narrowly scoped session:

```http
POST /mobile/payment-sessions
Content-Type: application/json

{
  "item": {
    "name": "Inttegro integration workshop",
    "type": "digital",
    "quantity": 1,
    "currency": "GHS",
    "value": 5000
  }
}
```

The successful response contains only an opaque, short-lived client secret:

```json
{ "paymentSessionSecret": "ps_client_..." }
```

The backend determines the authoritative account, amount, currency, eligible
payment methods, and expiry. It verifies final payment state server-side before
fulfillment.

## Current gate

The public mobile payment-session endpoint has not landed in
`openapi/commerce.yml`, and the Flutter and React Native native registrations
are intentionally absent. Consequently:

- SwiftUI and Compose use explicit preview adapters and are compiled as native
  apps without claiming to process money.
- Flutter and React Native show the real client-side integration and backend
  boundary, but device execution waits for native plugin registration.
- No demo invents a merchant credential, undocumented Inttegro endpoint, or
  false success response.

When the public session contract ships, the server demos can add the backend
route and the mobile SDK transports can replace the preview adapters without
changing the application-level presentation flow.
