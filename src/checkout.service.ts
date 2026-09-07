import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  InttegroAPIError,
  InttegroClient,
  type CreateOrderRequest,
  type Product,
} from '@inttegro/inttegro-sdk';

import { campaignTiers, CheckoutDto, type CampaignTier } from './checkout.dto.js';

/**
 * Inttegro integration map
 *
 * INTTEGRO:FLOW [hosted-checkout] Validate the contribution, resolve its
 * catalogue price with a server credential, create and finalize an Order, and
 * return only Inttegro's hosted checkout URL to the controller.
 * INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY belongs only in this
 * trusted Nest process and a deployment secret store. It must never enter a
 * rendered page, public JavaScript bundle, redirect query, or raw error.
 * INTTEGRO:ALTERNATIVE [hosted-checkout] A direct payment flow provides more
 * control, but makes the fundraiser responsible for payment state, recovery,
 * method-specific confirmation, testing, and a larger compliance surface.
 * INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 * See ../INTEGRATION_GUIDE.md and ../integration-decisions.json for the shared
 * rationale and machine-readable alternatives.
 */

const BASE_CONTRIBUTION = { currency: 'ghs', value: 5_000 } as const;

export class DemoError extends Error {
  constructor(
    readonly code: 'configuration_error' | 'validation_error' | 'api_error',
    message: string,
  ) {
    super(message);
  }
}

type CatalogSelection = {
  type: Product['type'];
  name: string;
  about?: string;
  reference?: string;
  price: NonNullable<Product['prices']>[number]['nominal'];
};

export async function parseCheckoutInput(body: Record<string, unknown>): Promise<CheckoutDto> {
  const input = plainToInstance(CheckoutDto, {
    name: String(body.name ?? '').trim(),
    email: String(body.email ?? '').trim(),
    phone: String(body.phone ?? '').trim(),
    tier: String(body.tier ?? '').trim(),
    attempt_id: String(body.attempt_id ?? '').trim(),
  });
  const errors = await validate(input, {
    forbidUnknownValues: true,
    stopAtFirstError: true,
  });
  if (errors.length > 0) {
    throw new DemoError(
      'validation_error',
      'Choose a contribution and enter a valid name, email, and international phone number.',
    );
  }
  return input;
}

export function selectCatalogProduct(product: Product, priceId: string): CatalogSelection {
  // INTTEGRO:SECURITY [catalog-authority] The form supplies only a bounded tier
  // key. Product identity, unit price, and currency are resolved and checked on
  // the trusted server, preventing a caller from rewriting the contribution.
  if (!product.active) {
    throw new DemoError('configuration_error', 'The configured campaign product is not active.');
  }
  const price = product.prices?.find((candidate) => candidate.id === priceId && candidate.active);
  if (
    !price ||
    price.nominal.currency.toLowerCase() !== BASE_CONTRIBUTION.currency ||
    price.nominal.value !== BASE_CONTRIBUTION.value
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
  input: CheckoutDto,
  publicOrigin: string,
  product: CatalogSelection,
): CreateOrderRequest {
  const tier = campaignTiers[input.tier];
  return {
    // INTTEGRO:DECISION [stable-idempotency-key] A retry for the same support
    // attempt reuses this key. A real fundraising service persists it beside a
    // contribution record rather than depending on a browser-rendered value.
    requestMeta: { idempotencyKey: `demo-${input.attempt_id}` },
    // INTTEGRO:DECISION [merchant-order-number] Give supporters and operators a
    // readable, retry-stable reference instead of falling back to the or_ ID.
    // Never place supporter PII in this value.
    number: `OPENFIELD-${input.attempt_id.replaceAll('_', '-').toUpperCase().slice(0, 48)}`,
    customerData: {
      name: input.name,
      emailAddress: input.email,
      phoneNumber: input.phone,
    },
    // INTTEGRO:DECISION [finalize-on-create] Openfield takes an immediate,
    // flexible-funding contribution. True all-or-nothing pledges require a
    // separate authorization/capture design and campaign-close orchestration.
    finalize: true,
    checkoutSettings: {
      redirectUrl: `${publicOrigin}/complete`,
      cancelUrl: `${publicOrigin}/cancel`,
    },
    lineItems: [{
      type: 'product',
      product: {
        // INTTEGRO:DECISION [catalog-snapshot] Snapshot the verified catalogue
        // item and use a server-owned tier multiplier. Do not accept arbitrary
        // price, currency, quantity, or product fields from the public form.
        ...product,
        quantity: tier.quantity,
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

@Injectable()
export class CheckoutService {
  async createHostedCheckout(body: Record<string, unknown>, requestOrigin: string) {
    const input = await parseCheckoutInput(body);
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

    const origin = validatedOrigin(process.env.INTTEGRO_DEMO_PUBLIC_URL?.trim() || requestOrigin);
    try {
      // INTTEGRO:ALTERNATIVE [server-api-key] A production Nest application can
      // register one configured client provider for connection reuse and app-
      // owned OpenTelemetry. Local construction keeps this demo easy to trace.
      const client = new InttegroClient({ apiKey });
      const product = selectCatalogProduct(
        await client.products.lookup({ productId }),
        priceId,
      );
      const order = await client.orders.create(buildOrderRequest(input, origin, product));
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
}
