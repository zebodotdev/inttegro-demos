# Demo acceptance contract

This contract keeps all Inttegro demos behaviorally equivalent while allowing
each application to follow its framework's normal project structure.

## V1 hosted-checkout flow

Every server-backed demo must expose:

| Route | Behavior |
| --- | --- |
| `GET /` | Render the demo checkout form and generate a fresh attempt ID. |
| `POST /checkout` | Validate the form, create and finalize an Inttegro order, then redirect to hosted checkout. |
| `GET /complete` | Explain that the browser returned successfully and server-side status remains authoritative. |
| `GET /cancel` | Explain that checkout was canceled and offer a safe retry. |
| `GET /health` | Return a non-secret readiness response without calling Inttegro. |

The order request must use:

- a server-only `INTTEGRO_API_KEY`;
- an idempotency key derived from the submitted checkout attempt ID;
- integer minor units (`5000` means GHS 50.00);
- `finalize: true`;
- an inline digital-product line item;
- explicit redirect and cancellation URLs; and
- the hosted checkout URL returned by Inttegro rather than a URL constructed by
  the demo.

## Input contract

The initial form contains `name`, `email`, `phone`, and `attempt_id`. The demo
product is fixed to keep examples comparable:

```json
{
  "name": "Inttegro integration workshop",
  "type": "digital",
  "quantity": 1,
  "currency": "GHS",
  "value": 5000
}
```

Applications must trim input, reject missing fields, require a syntactically
valid email address, and reject attempt IDs outside `[A-Za-z0-9_-]`.

## Error contract

- Missing server configuration is reported as `configuration_error`.
- Invalid customer input is reported as `validation_error`.
- Inttegro SDK errors are mapped to a safe code and message.
- API keys, authorization headers, stack traces, and raw upstream payloads are
  never sent to the browser.
- A retry of the same logical submission reuses the same attempt ID and
  therefore the same idempotency key.

## Mobile contract

Mobile applications never receive `INTTEGRO_API_KEY`. Their demo backend creates
a short-lived, narrowly scoped payment session. The application passes only the
opaque payment-session secret and presentation configuration to the Inttegro
SDK. A client callback is not proof of payment; fulfillment uses authoritative
server-side payment state.

The mobile payment-session transport remains gated until its public API contract
lands in `openapi/commerce.yml`.

## Verification

Every server-backed demo must provide:

- one command to install dependencies;
- one command to run locally;
- one command that performs its available static and automated checks;
- at least one test for invalid input;
- at least one test proving the expected Inttegro order request; and
- an `.env.example` containing placeholders only.

Mobile demos instead test configuration validation and the demo-backend request
boundary. Native UI previews must be clearly labeled and must not simulate a
live Inttegro API response. See [MOBILE.md](./MOBILE.md).
