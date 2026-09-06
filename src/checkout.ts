import {
  Currencies,
  InttegroAPIError,
  InttegroClient,
  ProductTypes,
  type CreateOrderRequest,
} from '@inttegro/inttegro-sdk';

/**
 * Inttegro integration map
 *
 * INTTEGRO:FLOW [hosted-checkout] Validate the ticket reservation, create and
 * finalize an Order, then hand the route the hosted invoice URL.
 * INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY belongs only in this
 * trusted Node process; never embed it in pages, public JavaScript, or errors.
 * INTTEGRO:ALTERNATIVE [hosted-checkout] Direct payment APIs offer more UI
 * control but require the merchant to own more payment state, recovery,
 * payment-method behavior, testing, and compliance analysis.
 * INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 * See ../../INTEGRATION_GUIDE.md and ../../integration-decisions.json for the full
 * rationale and machine-readable alternatives.
 */

export type CheckoutInput = {
  name: string;
  email: string;
  phone: string;
  attemptId: string;
};

export class DemoError extends Error {
  constructor(
    readonly code: 'configuration_error' | 'validation_error' | 'api_error',
    message: string,
  ) {
    super(message);
  }
}

export function parseCheckoutInput(body: Record<string, unknown>): CheckoutInput {
  const input = {
    name: String(body.name ?? '').trim(),
    email: String(body.email ?? '').trim(),
    phone: String(body.phone ?? '').trim(),
    attemptId: String(body.attempt_id ?? '').trim(),
  };
  if (!input.name || !input.phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new DemoError('validation_error', 'Enter a name, valid email, and phone number.');
  }
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(input.attemptId)) {
    throw new DemoError('validation_error', 'Start a fresh checkout and try again.');
  }
  return input;
}

export function buildOrderRequest(input: CheckoutInput, publicOrigin: string): CreateOrderRequest {
  return {
    // INTTEGRO:DECISION [stable-idempotency-key] The key is stable for one
    // browser-rendered attempt. A production system persists a key derived from
    // its cart/reservation; generating a fresh key during a retry allows duplicates.
    // https://studio.inttegro.com/idempotency
    request_meta: { idempotency_key: `demo-${input.attemptId}` },
    // INTTEGRO:DECISION [inline-customer] Guest ticketing uses customer_data.
    // Resolve a stored customer_id server-side for account-based journeys; the
    // Orders API accepts exactly one customer representation.
    customer_data: {
      name: input.name,
      email_address: input.email,
      phone_number: input.phone,
    },
    // INTTEGRO:DECISION [finalize-on-create] The reservation total is settled.
    // For mutable tax, inventory, approval, or line items, create a draft, make
    // the updates, and call the finalize operation only at the commitment point.
    finalize: true,
    checkout_settings: {
      redirect_url: `${publicOrigin}/complete`,
      cancel_url: `${publicOrigin}/cancel`,
    },
    line_items: [{
      type: 'product',
      product: {
        // INTTEGRO:DECISION [inline-product] A self-contained event uses inline
        // product data. Catalog-backed flows can use product_id plus price or
        // price_id; do not mix the two request shapes.
        type: ProductTypes.Digital,
        name: 'Afterglow Sessions - Courtyard admission',
        quantity: 1,
        // INTTEGRO:DECISION [minor-unit-money] 5000 minor units is GHS 50.00.
        price: { currency: Currencies.GHS, value: 5000 },
      },
    }],
  };
}

function publicOrigin(requestOrigin: string): string {
  // INTTEGRO:SECURITY [configured-public-origin] Production should supply an
  // allow-listed public origin. Only trust request Host/proxy headers after
  // configuring the exact proxy chain. Inttegro appends order_id on return.
  const configured = process.env.INTTEGRO_DEMO_PUBLIC_URL?.trim() || requestOrigin;
  try {
    return new URL(configured).origin;
  } catch {
    throw new DemoError('configuration_error', 'The demo public URL is invalid.');
  }
}

export async function createHostedCheckout(input: CheckoutInput, requestOrigin: string) {
  // INTTEGRO:SECURITY [server-api-key] Use a managed runtime secret in
  // production. Do not pass this credential into browser-visible configuration.
  const apiKey = process.env.INTTEGRO_API_KEY?.trim();
  if (!apiKey) throw new DemoError('configuration_error', 'Set INTTEGRO_API_KEY on the server.');

  try {
    // INTTEGRO:ALTERNATIVE [server-api-key] A production app can inject one
    // startup-configured client for connection reuse and application-owned
    // tracing. The SDK uses your OpenTelemetry provider and chooses no exporter.
    // https://studio.inttegro.com/sdk-observability
    const client = new InttegroClient({ apiKey });
    const order = await client.orders.create(buildOrderRequest(input, publicOrigin(requestOrigin)));
    // INTTEGRO:DECISION [returned-checkout-url] Use the server response rather
    // than constructing a URL from order.id and undocumented routing details.
    const checkoutUrl = order.invoice?.format?.web?.url;
    if (!checkoutUrl) throw new DemoError('api_error', 'Inttegro did not return a hosted checkout URL.');
    return { orderId: order.id, checkoutUrl };
  } catch (error) {
    // INTTEGRO:SECURITY [safe-error-boundary] Map failures to safe, stable
    // messages. Keep raw payloads, stack traces, and authorization data out of
    // the browser; log only privacy-safe diagnostics and request IDs.
    if (error instanceof DemoError) throw error;
    if (error instanceof InttegroAPIError) {
      throw new DemoError('api_error', 'Inttegro rejected the checkout request.');
    }
    throw new DemoError('api_error', 'Checkout is temporarily unavailable.');
  }
}
