import {
  Currencies,
  InttegroAPIError,
  InttegroClient,
  ProductTypes,
  type CreateOrderRequest,
} from '@inttegro/inttegro-sdk';

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
    request_meta: { idempotency_key: `demo-${input.attemptId}` },
    customer_data: {
      name: input.name,
      email_address: input.email,
      phone_number: input.phone,
    },
    finalize: true,
    checkout_settings: {
      redirect_url: `${publicOrigin}/complete`,
      cancel_url: `${publicOrigin}/cancel`,
    },
    line_items: [{
      type: 'product',
      product: {
        type: ProductTypes.Digital,
        name: 'Inttegro integration workshop',
        quantity: 1,
        price: { currency: Currencies.GHS, value: 5000 },
      },
    }],
  };
}

function publicOrigin(requestOrigin: string): string {
  const configured = process.env.INTTEGRO_DEMO_PUBLIC_URL?.trim() || requestOrigin;
  try {
    return new URL(configured).origin;
  } catch {
    throw new DemoError('configuration_error', 'The demo public URL is invalid.');
  }
}

export async function createHostedCheckout(input: CheckoutInput, requestOrigin: string) {
  const apiKey = process.env.INTTEGRO_API_KEY?.trim();
  if (!apiKey) throw new DemoError('configuration_error', 'Set INTTEGRO_API_KEY on the server.');

  try {
    const client = new InttegroClient({ apiKey });
    const order = await client.orders.create(buildOrderRequest(input, publicOrigin(requestOrigin)));
    const checkoutUrl = order.invoice?.format?.web?.url;
    if (!checkoutUrl) throw new DemoError('api_error', 'Inttegro did not return a hosted checkout URL.');
    return { orderId: order.id, checkoutUrl };
  } catch (error) {
    if (error instanceof DemoError) throw error;
    if (error instanceof InttegroAPIError) {
      throw new DemoError('api_error', 'Inttegro rejected the checkout request.');
    }
    throw new DemoError('api_error', 'Checkout is temporarily unavailable.');
  }
}
