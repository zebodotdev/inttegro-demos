import {
  InttegroAPIError,
  InttegroClient,
  type CreateOrderRequest,
  type Product,
} from '@inttegro/inttegro-sdk';

/**
 * Inttegro integration map
 *
 * INTTEGRO:FLOW [hosted-checkout] This server-only module validates a public
 * contribution, resolves its configured catalogue item, creates and finalizes
 * an Order, and returns the hosted Checkout URL supplied by Inttegro.
 * INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY stays in Astro's Node
 * runtime. It must never enter an Astro component prop, rendered page, public
 * environment variable, browser bundle, or raw error response.
 * INTTEGRO:ALTERNATIVE [hosted-checkout] Direct API payment is appropriate only
 * when the application can own the larger payment state machine, recovery UI,
 * payment-method behavior, testing, and compliance analysis.
 * INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 * See ../../INTEGRATION_GUIDE.md and ../../integration-decisions.json for the
 * shared rationale and machine-readable alternatives.
 */

const contributionTiers = {
  seed: { quantity: 1 },
  grower: { quantity: 2 },
  steward: { quantity: 5 },
} as const;

type ContributionTier = keyof typeof contributionTiers;

export type CheckoutInput = {
  name: string;
  email: string;
  phone: string;
  tier: ContributionTier;
  attemptId: string;
};

type CatalogSelection = {
  type: Product['type'];
  name: string;
  about?: string;
  reference?: string;
  price: NonNullable<Product['prices']>[number]['nominal'];
};

export class DemoError extends Error {
  constructor(
    readonly code: 'configuration_error' | 'validation_error' | 'api_error',
    message: string,
  ) {
    super(message);
  }
}

function valueFrom(values: FormData | Record<string, unknown>, key: string): string {
  return String(values instanceof FormData ? values.get(key) ?? '' : values[key] ?? '').trim();
}

export function parseCheckoutInput(values: FormData | Record<string, unknown>): CheckoutInput {
  const input = {
    name: valueFrom(values, 'name'),
    email: valueFrom(values, 'email'),
    phone: valueFrom(values, 'phone'),
    tier: valueFrom(values, 'tier'),
    attemptId: valueFrom(values, 'attempt_id'),
  };

  if (
    input.name.length < 2
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
    || !/^\+[1-9][0-9]{7,14}$/.test(input.phone)
    || !(input.tier in contributionTiers)
    || !/^[A-Za-z0-9_-]{8,100}$/.test(input.attemptId)
  ) {
    throw new DemoError(
      'validation_error',
      'Choose a contribution and enter a valid name, email, and international phone number.',
    );
  }

  return { ...input, tier: input.tier as ContributionTier };
}

export function selectCatalogProduct(product: Product, priceId: string): CatalogSelection {
  // INTTEGRO:SECURITY [catalog-authority] Public input names only one bounded
  // tier. Product identity, price identity, currency, and unit amount come from
  // trusted configuration and the Product returned by Inttegro.
  if (!product.active) {
    throw new DemoError('configuration_error', 'The configured campaign product is not active.');
  }
  const price = product.prices?.find((candidate) => candidate.id === priceId && candidate.active);
  if (
    !price
    || price.nominal.currency.toLowerCase() !== 'ghs'
    || price.nominal.value !== 5_000
  ) {
    throw new DemoError(
      'configuration_error',
      'The campaign requires an active GHS 50 base contribution price.',
    );
  }
  return {
    type: product.type,
    name: product.name,
    ...(product.about ? { about: product.about } : {}),
    ...(product.reference ? { reference: product.reference } : {}),
    price: price.nominal,
  };
}

export function buildOrderRequest(
  input: CheckoutInput,
  publicOrigin: string,
  product: CatalogSelection,
): CreateOrderRequest {
  return {
    // INTTEGRO:DECISION [stable-idempotency-key] One rendered attempt ID
    // represents one logical contribution and remains stable across retries.
    requestMeta: { idempotencyKey: `demo-${input.attemptId}` },
    // INTTEGRO:DECISION [merchant-order-number] The readable reference contains
    // no supporter PII and remains stable when the same attempt is replayed.
    number: `OPENFIELD-${input.attemptId.replaceAll('_', '-').toUpperCase().slice(0, 48)}`,
    customerData: {
      name: input.name,
      emailAddress: input.email,
      phoneNumber: input.phone,
    },
    // INTTEGRO:DECISION [finalize-on-create] Openfield accepts immediate,
    // flexible-funding contributions whose total is settled before submission.
    finalize: true,
    checkoutSettings: {
      redirectUrl: `${publicOrigin}/complete`,
      cancelUrl: `${publicOrigin}/cancel`,
    },
    lineItems: [{
      type: 'product',
      product: {
        // INTTEGRO:DECISION [catalog-snapshot] Snapshot the trusted catalogue
        // item and multiply it only by an allow-listed server-owned quantity.
        // INTTEGRO:ALTERNATIVE [catalog-snapshot] Use product_id plus price_id
        // when the selected SDK surface exposes that catalogue-reference union.
        ...product,
        quantity: contributionTiers[input.tier].quantity,
      },
    }],
    customData: {
      campaign: 'riverbend-learning-garden',
      contributionTier: input.tier,
    },
  };
}

function validatedOrigin(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('invalid protocol');
    return url.origin;
  } catch {
    throw new DemoError('configuration_error', 'The demo public URL is invalid.');
  }
}

export async function createHostedCheckout(
  values: FormData | Record<string, unknown>,
  requestUrl: string,
) {
  const input = parseCheckoutInput(values);
  const apiKey = process.env.INTTEGRO_API_KEY?.trim();
  const productId = process.env.INTTEGRO_DEMO_PRODUCT_ID?.trim() ?? '';
  const priceId = process.env.INTTEGRO_DEMO_PRICE_ID?.trim() ?? '';

  if (!apiKey) {
    throw new DemoError('configuration_error', 'Set INTTEGRO_API_KEY on the server.');
  }
  if (!/^prod_[A-Za-z0-9]+$/.test(productId) || !/^pr_[A-Za-z0-9]+$/.test(priceId)) {
    throw new DemoError(
      'configuration_error',
      'Set INTTEGRO_DEMO_PRODUCT_ID and INTTEGRO_DEMO_PRICE_ID on the server.',
    );
  }

  // INTTEGRO:SECURITY [configured-public-origin] Production deployments should
  // set an allow-listed origin. Request origin is a localhost convenience and
  // is safe only behind a correctly configured trusted proxy chain.
  const origin = validatedOrigin(
    process.env.INTTEGRO_DEMO_PUBLIC_URL?.trim() || new URL(requestUrl).origin,
  );

  try {
    // INTTEGRO:ALTERNATIVE [server-api-key] A long-running application can
    // construct and inject one client at startup for fail-fast configuration,
    // connection reuse, and application-owned OpenTelemetry.
    const inttegro = new InttegroClient({ apiKey });
    // INTTEGRO:FLOW [catalog-lookup] Resolve the configured Product on every
    // checkout so publication and Price changes take effect immediately.
    // https://studio.inttegro.com/products
    const product = selectCatalogProduct(
      await inttegro.products.lookup({ productId }),
      priceId,
    );
    const order = await inttegro.orders.create(buildOrderRequest(input, origin, product));
    const checkoutUrl = order.invoice?.format?.web?.url;
    if (!checkoutUrl) {
      throw new DemoError('api_error', 'Inttegro did not return a hosted checkout URL.');
    }
    return { orderId: order.id, checkoutUrl };
  } catch (error) {
    if (error instanceof DemoError) throw error;
    if (error instanceof InttegroAPIError) {
      throw new DemoError('api_error', 'Inttegro rejected the contribution request.');
    }
    throw new DemoError('api_error', 'Contributions are temporarily unavailable.');
  }
}
