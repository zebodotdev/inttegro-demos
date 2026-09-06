# Inttegro integration guide

This guide explains the choices shared by the demo applications. It is written
for engineers evaluating an integration and for machine readers that need
stable, explicit decision context. The runnable code remains the source for
framework mechanics; this guide explains *why* the code has that shape.

For a structured version of the same decisions, read
[`integration-decisions.json`](./integration-decisions.json). Decision IDs in
that file are also embedded in source comments, so a reader can move from a
line of code to its rationale and alternatives without guessing.

## Comment vocabulary

Comments beside Inttegro integration code use these stable markers:

| Marker | Meaning |
| --- | --- |
| `INTTEGRO:FLOW` | A step in the request, checkout, or verification lifecycle. |
| `INTTEGRO:SECURITY` | A trust boundary, secret-handling rule, or privacy constraint. |
| `INTTEGRO:DECISION` | The option selected by these demos and the reason for it. |
| `INTTEGRO:ALTERNATIVE` | A valid option that may better fit another product. |
| `INTTEGRO:VERIFY` | A result that must be confirmed using authoritative server state. |
| `INTTEGRO:OBSERVABILITY` | Logging, tracing, correlation, and data-minimization guidance. |
| `INTTEGRO:DOCS` | A canonical Inttegro documentation link. |

The optional value in square brackets is a decision ID from the JSON registry,
for example `INTTEGRO:DECISION [finalize-on-create]`. Markers are deliberately
plain text so source search, documentation generators, and retrieval systems
can index them in every language.

## Architecture A: hosted checkout for web applications

Next.js, Nuxt, Express, Django, FastAPI, Rails, Laravel, Go, and Spring Boot use
the same server-owned flow:

```text
browser form
    -> demo server validates customer and attempt data
    -> server creates and finalizes an order with its Inttegro API key
    -> server stores the returned order ID and sends a 303 redirect
    -> browser completes the hosted Inttegro experience
    -> browser returns to /complete or /cancel with order_id appended
    -> merchant server looks up the order before fulfillment
```

### Why hosted checkout

These demos choose the hosted invoice URL returned by the finalized order. It
keeps payment entry and provider-specific confirmation inside Inttegro while
the merchant application owns products, customer context, totals, and
fulfillment. It is the smallest production-shaped integration for a web app.

An application with a materially custom payment experience can use the Orders
payment endpoints instead, but then it owns more state transitions, recovery
UI, payment-method behavior, testing, and compliance analysis. Do not copy only
the redirect from these demos if your intended architecture is direct API
payment; model that lifecycle explicitly.

Canonical documentation:

- [Accept payment with Inttegro Checkout](https://studio.inttegro.com/accept-payment-with-inttegro-checkout)
- [Orders API and lifecycle](https://studio.inttegro.com/orders)
- [Payment methods](https://studio.inttegro.com/payment-methods)

### Keep the API key on a trusted server

`INTTEGRO_API_KEY` is read only by server code. Browser JavaScript, rendered
HTML, mobile bundles, logs, error query strings, and source-control files must
never contain it. Frameworks differ in how they expose environment variables;
avoid conventions such as `NEXT_PUBLIC_`, `NUXT_PUBLIC_`, `VITE_`, or
`EXPO_PUBLIC_` for an Inttegro API key because those prefixes intentionally
publish values to client code.

The demos construct SDK clients close to the operation to keep each example
self-contained. A long-running production service can inject and reuse one
client configured at startup. Reuse is preferable when the SDK transport pools
connections, configuration should fail fast, or the application injects an
OpenTelemetry provider. Never rotate a key by copying it into code; use the
platform's secret store and a controlled process restart or client refresh.

Canonical documentation:

- [API keys](https://studio.inttegro.com/keys)
- [Inttegro SDKs](https://studio.inttegro.com/sdks)

### Make order creation replay-safe

The browser generates one opaque `attempt_id` when it renders the checkout.
The server validates it and derives `demo-{attempt_id}` as the order-creation
idempotency key. If a network retry repeats the same logical submission, it
reuses the key and Inttegro can return the first successful result instead of
creating a second order.

The attempt ID is not authentication, authorization, or a CSRF control. A real
merchant should bind the idempotency key to a durable cart, invoice, or checkout
attempt stored in its database and enforce normal session ownership and CSRF
protection. Generate a new key only when the business operation has genuinely
changed. Reusing a key with a changed payload causes an idempotency conflict.

Canonical documentation:

- [Idempotent requests](https://studio.inttegro.com/idempotency)

### Choose customer and catalog representations deliberately

Order creation accepts exactly one customer representation. The web demos use
inline `customer_data` because their stories collect guest details at checkout.
Applications with accounts, repeat buyers, saved addresses, or customer history
should usually create or resolve a Customer on the server and send
`customer_id` instead. Never send both fields.

The demos also use an inline product because each application presents one
self-contained item. A merchant with a canonical Inttegro catalog can instead
send a `product_id` with either an explicit price or a `price_id`. Catalog-backed
orders give stable references and snapshot the catalog data into the order.
Do not mix inline product fields with `product_id` in one line item.

Every `price.value` is an integer in the currency's smallest unit. In these
demos, `5000` GHS minor units means GHS 50.00. Convert decimal user input with a
currency-aware money type; do not use binary floating-point arithmetic for
amounts.

Canonical documentation:

- [Orders API and line-item shapes](https://studio.inttegro.com/orders)

### Finalize now or build a draft

The demos send `finalize: true`. Their cart is already complete, so one request
freezes its line items and totals and produces the invoice formats needed for
checkout. This reduces round trips and keeps every framework comparable.

Use the two-step alternative—create a draft, update it, then call the finalize
operation—when totals depend on shipping, tax, inventory, manual approval, or
other work that is not settled at creation time. Finalization is a business
boundary: after it, treat the order as immutable rather than silently changing
what the customer agreed to pay.

### Treat the public origin as deployment configuration

Inttegro returns the customer to the `redirect_url` or `cancel_url` supplied in
`checkout_settings` and appends the order ID. The URLs must be absolute HTTP(S)
URLs and must not already contain an `order_id` parameter. The demos derive a
local origin from the request but allow `INTTEGRO_DEMO_PUBLIC_URL` to override
it for tunnels, reverse proxies, and production hosts.

Production services should prefer an allow-listed configured origin. Trust
forwarded host and protocol headers only when the application is behind a known
proxy and its framework is configured with the exact trusted proxy chain. An
untrusted Host header must not be allowed to choose a payment return target.

### Redirect to the URL Inttegro returned

The hosted URL is read from `order.invoice.format.web.url`. Do not construct an
Inttegro URL from an order ID or rely on undocumented hostname/path patterns.
Returned links can evolve independently of the merchant integration.

The POST handlers answer with `303 See Other`, which tells the browser to
follow the hosted URL with GET. `302` is historically ambiguous after POST;
`307` and `308` preserve POST and could resubmit the merchant form body to the
checkout destination. Client-side navigation is possible, but adds JavaScript
failure modes and is unnecessary for this server-rendered flow.

### Store correlation, then verify before fulfillment

The demos place the returned order ID in a short-lived `HttpOnly`, `SameSite=Lax`
cookie so the example can demonstrate server-held correlation without exposing
the value to browser scripts. That cookie is not proof of ownership or payment.
A production merchant should persist its own order/cart ID, the Inttegro order
ID, the customer or tenant owner, and the idempotency key in one durable record.

Neither arrival at `/complete` nor a successful payment-sheet callback is
authoritative fulfillment evidence. A customer can replay a return URL, close a
browser before returning, or complete asynchronously. Read the appended order
ID, resolve it through the merchant's ownership mapping, and use an
authenticated server-side order lookup before releasing goods or services.

Inttegro does not currently expose merchant-facing webhooks. Use bounded
polling for the immediate result and a scheduled reconciliation job for orders
left in non-terminal states. Make fulfillment idempotent so both paths can
observe the same paid order safely. Do not poll forever inside one browser
request.

Canonical documentation:

- [Webhooks and reconciliation](https://studio.inttegro.com/webhooks)
- [Orders lookup](https://studio.inttegro.com/orders#lookup-an-order)

### Preserve useful errors without leaking upstream details

The demos translate failures into three stable public categories:
`configuration_error`, `validation_error`, and `api_error`. Raw SDK responses,
authorization headers, stack traces, and provider details stay server-side.
Production systems should log the stable merchant order ID, Inttegro request ID
when available, operation, duration, and safe error type—not API keys, customer
contact details, payment data, or entire request/response bodies.

Current server SDKs integrate with an application-owned OpenTelemetry provider.
They do not select an exporter or vendor. Configure tracing once at application
startup if you need it; preserve the request context across retries and
background reconciliation.

Canonical documentation:

- [SDK observability](https://studio.inttegro.com/sdk-observability)

## Architecture B: native payment sheet

SwiftUI, Jetpack Compose, Flutter, and React Native use a merchant-backend
boundary:

```text
mobile app creates an opaque attempt ID
    -> authenticated merchant backend creates and finalizes the order
    -> backend returns only { orderId }
    -> app configures and presents the Inttegro payment sheet
    -> app reports immediate UX feedback
    -> merchant backend verifies order state before fulfillment
```

The Next.js demo supplies the illustrative `POST /mobile/orders` endpoint. It
keeps both `INTTEGRO_API_KEY` and `INTTEGRO_DEMO_CUSTOMER_ID` server-side,
accepts a narrow request body, limits the order to the intended product and
payment method, and returns only the order ID required by the SDK.

### Authenticate the mobile-to-backend request in production

The endpoint is intentionally minimal so each native app can run locally. It
does not demonstrate merchant authentication. A production endpoint must bind
the request to the signed-in customer, authorize the cart on the server, apply
rate limits, and consider platform attestation or abuse controls. Never accept
price, currency, product identity, fulfillment state, or `customer_id` from an
untrusted mobile client without server-side validation.

If your product supports guest checkout, issue a short-lived, narrowly scoped
checkout capability from your backend rather than embedding the Inttegro API
key. If the merchant already has a backend-for-frontend or API gateway, put the
order-creation operation there; a Next.js route is not required.

### Pass an order ID, not a server credential

The mobile SDK receives the finalized `orderId` and a registered return URL.
The API key is never compiled into the application. The return URL brings the
user back after external authorization but is not payment confirmation. Make
the custom URL scheme or universal/app link unique to the application and
register it in each platform's native configuration.

### Observe lifecycle events safely

Each demo subscribes to the SDK's privacy-safe payment-sheet telemetry and logs
bounded fields such as flow ID, event name, sequence, operation, HTTP status,
request ID, and error type. Production applications can bridge these events to
their own telemetry pipeline, but should preserve the SDK's data minimization.
Do not attach customer details, secrets, or raw provider payloads.

Telemetry is diagnostic, not business state. A `completed` UI result means the
sheet completed its client-side flow; the merchant backend still owns payment
verification and idempotent fulfillment.

## Production checklist

Before adapting a demo for live traffic:

1. Move API keys into the deployment platform's secret store and test rotation.
2. Persist merchant and Inttegro identifiers in a durable ownership mapping.
3. Derive idempotency keys from stable business attempts and reuse them on retry.
4. Recompute products, quantities, price, currency, discounts, tax, and shipping
   on the trusted server.
5. Configure an allow-listed public origin and trusted proxy settings.
6. Add authentication, authorization, CSRF protection where relevant, rate
   limiting, and abuse controls.
7. Implement bounded status lookup plus scheduled reconciliation.
8. Make fulfillment and post-payment side effects idempotent.
9. Configure privacy-safe logs, metrics, traces, alerts, and request-ID capture.
10. Test success, cancellation, declines, timeouts, retries, duplicate submits,
    deep-link returns, process death, accessibility, and reduced connectivity.

The demos optimize for clarity and cross-framework comparability. Your
production design should preserve the trust boundaries and lifecycle rules even
when you choose one of the documented alternatives.
