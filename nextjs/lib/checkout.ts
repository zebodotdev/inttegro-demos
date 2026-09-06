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
 * INTTEGRO:FLOW This module is server-only. It validates an untrusted request,
 * creates a finalized Order, and returns either its hosted checkout URL (web)
 * or its ID (native payment sheet).
 * INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY and the demo Customer ID
 * must never move into a NEXT_PUBLIC_* variable, Client Component, or mobile
 * response. A browser or application bundle cannot keep a merchant secret.
 * INTTEGRO:DECISION [hosted-checkout] Web customers use the hosted invoice URL
 * returned by Inttegro, keeping payment entry and provider confirmation out of
 * the merchant application.
 * INTTEGRO:ALTERNATIVE [hosted-checkout] Direct API payment is appropriate only
 * when the merchant intends to own the larger payment state machine, recovery
 * UI, method-specific behavior, testing, and compliance analysis.
 * INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 * See ../../INTEGRATION_GUIDE.md and ../../integration-decisions.json for the complete
 * rationale and machine-readable alternatives.
 */

export type CheckoutInput = {
  name: string;
  email: string;
  phone: string;
  attemptId: string;
};

export type MobileCheckoutInput = {
  attemptId: string;
};

type MobileCreateOrderRequest = CreateOrderRequest & {
  payment_method_types: ['mobile_money'];
};

export class DemoError extends Error {
  readonly code: 'configuration_error' | 'validation_error' | 'api_error';

  constructor(
    code: 'configuration_error' | 'validation_error' | 'api_error',
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const attemptPattern = /^[A-Za-z0-9_-]{8,100}$/;

export function parseCheckoutInput(form: FormData): CheckoutInput {
  const input = {
    name: String(form.get('name') ?? '').trim(),
    email: String(form.get('email') ?? '').trim(),
    phone: String(form.get('phone') ?? '').trim(),
    attemptId: String(form.get('attempt_id') ?? '').trim(),
  };

  if (!input.name || !input.phone || !emailPattern.test(input.email)) {
    throw new DemoError('validation_error', 'Enter a name, valid email, and phone number.');
  }
  if (!attemptPattern.test(input.attemptId)) {
    throw new DemoError('validation_error', 'Start a fresh checkout and try again.');
  }
  return input;
}

export function parseMobileCheckoutInput(value: unknown): MobileCheckoutInput {
  if (
    typeof value !== 'object'
    || value === null
    || Array.isArray(value)
    || Object.keys(value).some((key) => key !== 'attemptId')
    || !('attemptId' in value)
    || typeof value.attemptId !== 'string'
  ) {
    throw new DemoError('validation_error', 'Send a valid mobile checkout attempt ID.');
  }

  const attemptId = value.attemptId.trim();
  if (!attemptPattern.test(attemptId)) {
    throw new DemoError('validation_error', 'Start a fresh mobile checkout and try again.');
  }
  return { attemptId };
}

function configuredOrigin(requestOrigin: string): string {
  // INTTEGRO:SECURITY [configured-public-origin] A configured public origin is
  // safer in production. The request origin keeps localhost convenient, but it
  // is safe only when Host/forwarded headers come through a trusted proxy chain.
  // Inttegro return URLs must be absolute HTTP(S) URLs and must not already
  // contain order_id; Inttegro appends the created order ID on return.
  const value = process.env.INTTEGRO_DEMO_PUBLIC_URL?.trim() || requestOrigin;
  try {
    return new URL(value).origin;
  } catch {
    throw new DemoError('configuration_error', 'The demo public URL is invalid.');
  }
}

export function buildOrderRequest(input: CheckoutInput, origin: string): CreateOrderRequest {
  return {
    // INTTEGRO:DECISION [stable-idempotency-key] One browser-rendered attempt ID
    // represents one logical order creation. Reuse it for retries. Production
    // systems should persist a key derived from a durable cart or invoice ID;
    // generating a fresh value on every retry defeats replay protection.
    // https://studio.inttegro.com/idempotency
    request_meta: { idempotency_key: `demo-${input.attemptId}` },

    // INTTEGRO:DECISION [inline-customer] This is a guest checkout, so the
    // request carries customer_data. Account-based products should resolve a
    // stored Customer server-side and send customer_id instead—never both.
    customer_data: {
      name: input.name,
      email_address: input.email,
      phone_number: input.phone,
    },

    // INTTEGRO:DECISION [finalize-on-create] The demo's lines and total are
    // already settled. finalize freezes the order and generates its invoice
    // formats in the same operation. If shipping, tax, approval, or inventory
    // can still change, create a draft, update it, then finalize explicitly.
    finalize: true,
    checkout_settings: {
      redirect_url: `${origin}/complete`,
      cancel_url: `${origin}/cancel`,
    },
    line_items: [
      {
        type: 'product',
        product: {
          // INTTEGRO:DECISION [inline-product] Inline data keeps this single-item
          // story self-contained. Catalog-backed merchants can send product_id
          // with an explicit price or price_id; do not mix catalog references
          // with inline product fields.
          type: ProductTypes.Physical,
          name: 'Dawn Brew Set',
          quantity: 1,
          // INTTEGRO:DECISION [minor-unit-money] Integer 5000 means GHS 50.00.
          // Convert variable prices with a currency-aware decimal/money type,
          // never binary floating-point arithmetic.
          price: { currency: Currencies.GHS, value: 5000 },
        },
      },
    ],
  };
}

export function buildMobileOrderRequest(
  input: MobileCheckoutInput,
  customerId: string,
): MobileCreateOrderRequest {
  return {
    // INTTEGRO:DECISION [stable-idempotency-key] A retry of the same native
    // checkout intent must send the same attempt ID. In production, persist it
    // with the authenticated customer's cart.
    request_meta: { idempotency_key: `mobile-demo-${input.attemptId}` },

    // INTTEGRO:SECURITY [server-customer-id] Customer ownership is resolved by
    // the trusted backend. Never let an untrusted app select an arbitrary
    // customer_id; derive it from the authenticated merchant principal.
    customer_id: customerId,
    // INTTEGRO:DECISION [finalize-on-create] The mobile SDK needs the ID of an
    // immutable checkout-ready order, so this fixed cart finalizes immediately.
    finalize: true,
    // INTTEGRO:DECISION [mobile-backend-boundary] The backend constrains allowed
    // methods and commercial data. The app submits only an opaque attempt ID.
    payment_method_types: ['mobile_money'],
    line_items: [
      {
        type: 'product',
        product: {
          type: ProductTypes.Physical,
          name: 'Dawn Brew Set',
          quantity: 1,
          price: { currency: Currencies.GHS, value: 5000 },
        },
      },
    ],
  };
}

export async function createHostedCheckout(input: CheckoutInput, requestOrigin: string) {
  // INTTEGRO:SECURITY [server-api-key] This function must remain on the server.
  // Use the deployment platform's secret manager in production and rotate the
  // key there; never serialize it into an error or response.
  const apiKey = process.env.INTTEGRO_API_KEY?.trim();
  if (!apiKey) {
    throw new DemoError('configuration_error', 'Set INTTEGRO_API_KEY on the server.');
  }

  const origin = configuredOrigin(requestOrigin);
  // INTTEGRO:ALTERNATIVE [server-api-key] A production service may construct and
  // inject one client at startup for fail-fast configuration, connection reuse,
  // and application-owned OpenTelemetry. Per-call construction is clearer here.
  // https://studio.inttegro.com/sdk-observability
  const inttegro = new InttegroClient({ apiKey });

  try {
    const order = await inttegro.orders.create(buildOrderRequest(input, origin));

    // INTTEGRO:DECISION [returned-checkout-url] Use the response's URL. Building
    // a URL from order.id would depend on undocumented Inttegro routing details.
    const checkoutUrl = order.invoice?.format?.web?.url;
    if (!checkoutUrl) {
      throw new DemoError('api_error', 'Inttegro did not return a hosted checkout URL.');
    }
    return { checkoutUrl, orderId: order.id };
  } catch (error) {
    // INTTEGRO:SECURITY [safe-error-boundary] Public errors stay stable and
    // non-sensitive. Capture request IDs and safe error metadata in protected
    // server telemetry; never return raw upstream payloads or authorization data.
    if (error instanceof DemoError) throw error;
    if (error instanceof InttegroAPIError) {
      throw new DemoError('api_error', 'Inttegro rejected the checkout request.');
    }
    throw new DemoError('api_error', 'Checkout is temporarily unavailable.');
  }
}

export async function createMobileCheckout(input: MobileCheckoutInput) {
  // INTTEGRO:FLOW [mobile-backend-boundary] This is the illustrative merchant
  // backend for all four native demos. A production route also authenticates
  // the caller, authorizes the cart, rate-limits abuse, and recomputes totals.
  // https://studio.inttegro.com/orders
  const apiKey = process.env.INTTEGRO_API_KEY?.trim();
  const customerId = process.env.INTTEGRO_DEMO_CUSTOMER_ID?.trim();
  if (!apiKey || !customerId) {
    throw new DemoError(
      'configuration_error',
      'Set INTTEGRO_API_KEY and INTTEGRO_DEMO_CUSTOMER_ID on the server.',
    );
  }

  const inttegro = new InttegroClient({ apiKey });
  try {
    const order = await inttegro.orders.create(buildMobileOrderRequest(input, customerId));
    if (!order.id?.trim()) {
      throw new DemoError('api_error', 'Inttegro did not return a checkout order ID.');
    }
    // Return only the minimal capability the SDK needs. Product, price,
    // customer_id, payment-method policy, and API key remain server-owned.
    return { orderId: order.id.trim() };
  } catch (error) {
    if (error instanceof DemoError) throw error;
    if (error instanceof InttegroAPIError) {
      throw new DemoError('api_error', 'Inttegro rejected the mobile checkout request.');
    }
    throw new DemoError('api_error', 'Mobile checkout is temporarily unavailable.');
  }
}
