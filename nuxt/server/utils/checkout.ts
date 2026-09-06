import { Currencies, InttegroAPIError, InttegroClient, ProductTypes, type CreateOrderRequest } from '@inttegro/inttegro-sdk';

/**
 * Inttegro integration map
 *
 * INTTEGRO:FLOW [hosted-checkout] This Nitro server utility validates an
 * untrusted form, creates a finalized Order, and returns the hosted invoice URL
 * that the route will redirect to.
 * INTTEGRO:SECURITY [server-api-key] Runtime config must keep the key private;
 * never place it under runtimeConfig.public or a NUXT_PUBLIC_* variable.
 * INTTEGRO:ALTERNATIVE [hosted-checkout] A direct API payment flow is possible,
 * but the merchant then owns additional payment states, recovery UI,
 * method-specific behavior, testing, and compliance analysis.
 * INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 * See ../../../INTEGRATION_GUIDE.md and ../../../integration-decisions.json for the shared
 * rationale and machine-readable alternatives.
 */

export class DemoError extends Error {
  constructor(readonly code: 'configuration_error' | 'validation_error' | 'api_error', message: string) { super(message); }
}

export type CheckoutInput = { name: string; email: string; phone: string; attemptId: string };

export function parseCheckoutInput(body: Record<string, unknown>): CheckoutInput {
  const input = { name: String(body.name ?? '').trim(), email: String(body.email ?? '').trim(), phone: String(body.phone ?? '').trim(), attemptId: String(body.attempt_id ?? '').trim() };
  if (!input.name || !input.phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new DemoError('validation_error', 'Enter a name, valid email, and phone number.');
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(input.attemptId)) throw new DemoError('validation_error', 'Start a fresh checkout and try again.');
  return input;
}

export function buildOrderRequest(input: CheckoutInput, origin: string): CreateOrderRequest {
  return {
    // INTTEGRO:DECISION [stable-idempotency-key] Reuse this key when retrying the
    // same logical checkout. Production systems should persist a cart- or
    // invoice-derived key; a fresh random key per network retry permits duplicates.
    // https://studio.inttegro.com/idempotency
    request_meta: { idempotency_key: `demo-${input.attemptId}` },
    // INTTEGRO:DECISION [inline-customer] customer_data fits this guest flow.
    // Account-based products should resolve customer_id on the server; the
    // Orders API accepts exactly one of these representations.
    customer_data: { name: input.name, email_address: input.email, phone_number: input.phone },
    // INTTEGRO:DECISION [finalize-on-create] This fixed cart is complete, so one
    // call freezes the order and creates invoice formats. If shipping, tax,
    // inventory, or approval is pending, create a draft and finalize later.
    finalize: true,
    checkout_settings: { redirect_url: `${origin}/complete`, cancel_url: `${origin}/cancel` },
    line_items: [{
      type: 'product',
      product: {
        // INTTEGRO:DECISION [inline-product] Inline product data keeps this demo
        // self-contained. Catalog users can choose product_id plus an explicit
        // price or price_id; do not mix catalog references with inline fields.
        type: ProductTypes.Physical,
        name: 'Dawn Brew Set',
        quantity: 1,
        // INTTEGRO:DECISION [minor-unit-money] 5000 minor units means GHS 50.00.
        price: { currency: Currencies.GHS, value: 5000 },
      },
    }],
  };
}

export async function createHostedCheckout(input: CheckoutInput, apiKey: string, origin: string) {
  // INTTEGRO:SECURITY [server-api-key] The SDK call belongs in Nitro server
  // code. Use a deployment secret manager in production, not source or public
  // runtime configuration.
  if (!apiKey.trim()) throw new DemoError('configuration_error', 'Set NUXT_INTTEGRO_API_KEY on the server.');
  let publicOrigin: string;
  // INTTEGRO:SECURITY [configured-public-origin] Prefer an allow-listed origin
  // in production. A request-derived fallback is safe only behind a precisely
  // configured trusted proxy chain. Return URLs must be absolute HTTP(S) URLs.
  try { publicOrigin = new URL(origin).origin; } catch { throw new DemoError('configuration_error', 'The demo public URL is invalid.'); }
  try {
    // INTTEGRO:ALTERNATIVE [server-api-key] Long-running apps may inject one SDK
    // client configured at startup for connection reuse and application-owned
    // OpenTelemetry. Per-operation construction keeps this demo focused.
    // https://studio.inttegro.com/sdk-observability
    const order = await new InttegroClient({ apiKey }).orders.create(buildOrderRequest(input, publicOrigin));
    // INTTEGRO:DECISION [returned-checkout-url] Use the URL in the response;
    // constructing one from order.id relies on undocumented routing details.
    const checkoutUrl = order.invoice?.format?.web?.url;
    if (!checkoutUrl) throw new DemoError('api_error', 'Inttegro did not return a hosted checkout URL.');
    return { checkoutUrl, orderId: order.id };
  } catch (error) {
    // INTTEGRO:SECURITY [safe-error-boundary] Never expose raw SDK payloads,
    // authorization data, or stack traces. Keep request IDs and safe diagnostics
    // in access-controlled server telemetry.
    if (error instanceof DemoError) throw error;
    if (error instanceof InttegroAPIError) throw new DemoError('api_error', 'Inttegro rejected the checkout request.');
    throw new DemoError('api_error', 'Checkout is temporarily unavailable.');
  }
}
