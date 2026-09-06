# Demo acceptance contract

This contract keeps all Inttegro demos behaviorally equivalent while allowing
each application to follow its framework's normal project structure.

## V1 hosted-checkout flow

Every server-backed demo must expose:

| Route | Behavior |
| --- | --- |
| `GET /` | Render the complete app story and generate a fresh checkout attempt ID. |
| `POST /checkout` | Validate the form, create and finalize an Inttegro order, then redirect to hosted checkout. |
| `GET /complete` | Explain that the browser returned successfully and server-side status remains authoritative. |
| `GET /cancel` | Explain that checkout was canceled and offer a safe retry. |
| `GET /health` | Return a non-secret readiness response without calling Inttegro. |

The order request must use:

- a server-only `INTTEGRO_API_KEY`;
- an idempotency key derived from the submitted checkout attempt ID;
- integer minor units (`5000` means GHS 50.00);
- `finalize: true`;
- an inline line item whose product type and name match the visible app story;
- explicit redirect and cancellation URLs; and
- the hosted checkout URL returned by Inttegro rather than a URL constructed by
  the demo.

## Input contract

The checkout form contains `name`, `email`, `phone`, and `attempt_id`. Each story
uses one fixed GHS 50.00 purchase so integrations remain comparable while the
surrounding application stays realistic:

| Story | API line item | Product type |
| --- | --- | --- |
| Kora Market | `Dawn Brew Set` | `physical` |
| Afterglow Sessions | `Afterglow Sessions - Courtyard admission` | `digital` |
| Ledgerline | `Invoice INV-2048` | `service` |

Every line item has quantity `1`, currency `GHS`, and value `5000` minor units.
Visible product names, totals, fulfillment language, and API requests must agree.

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
and finalizes an immutable, mobile-money-only checkout order from a
client-generated attempt ID. The application passes only its `orderId` and
presentation configuration to the Inttegro SDK. A client callback is not proof
of payment; fulfillment uses authoritative server-side payment state.

Each mobile host consumes the SDK's privacy-safe telemetry stream for the
payment-sheet lifecycle. Card, Apple Pay, and Google Pay must not be advertised
until those payment methods are implemented end to end.

## Verification

Every server-backed demo must provide:

- one command to install dependencies;
- one command to run locally;
- one command that performs its available static and automated checks;
- at least one test for invalid input;
- at least one test proving the expected Inttegro order request; and
- an `.env.example` containing placeholders only.

Every V1 integration entry point must also:

- link to applicable canonical documentation at `studio.inttegro.com`;
- use the stable `INTTEGRO:*` comment vocabulary documented in
  [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md);
- identify consequential choices with a decision ID from
  [`integration-decisions.json`](./integration-decisions.json).

Taken together, each demo's entry points must explain at least one viable
alternative where the example's choice is not universally correct.

Comments must describe trust boundaries and lifecycle semantics, not merely
translate the next line of code. The JSON registry is part of the public demo
contract: paths must exist, decision IDs must be unique, and every referenced
documentation key must resolve.

## Release and permalink contract

Every implemented V1 demo has a semantic version and immutable annotated tag in
the current release manifest. A release includes:

- one signed suite tag named `v{version}`;
- one signed alias named `{demo-id}-v{version}` for every implemented demo;
- a tracked `releases/v{version}.json` manifest containing the exact demo paths
  and source entry points; and
- a single GitHub Release on the suite tag, generated from the corresponding
  tracked Markdown notes.

All tags for a suite release point to the same commit. Studio permalinks use a
per-demo tag, repository-relative source path, and explicit line range. They
must never use `main`, a branch name, or an unversioned source URL. Published
tags are never moved or reused; corrections require a new patch release. See
[RELEASING.md](./RELEASING.md) for the complete policy.

Mobile demos instead test configuration validation and the demo-backend request
boundary, then follow the native device and accessibility matrix in
[MOBILE.md](./MOBILE.md).
