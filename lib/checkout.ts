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

function configuredOrigin(requestOrigin: string): string {
  const value = process.env.INTTEGRO_DEMO_PUBLIC_URL?.trim() || requestOrigin;
  try {
    return new URL(value).origin;
  } catch {
    throw new DemoError('configuration_error', 'The demo public URL is invalid.');
  }
}

export function buildOrderRequest(input: CheckoutInput, origin: string): CreateOrderRequest {
  return {
    request_meta: { idempotency_key: `demo-${input.attemptId}` },
    customer_data: {
      name: input.name,
      email_address: input.email,
      phone_number: input.phone,
    },
    finalize: true,
    checkout_settings: {
      redirect_url: `${origin}/complete`,
      cancel_url: `${origin}/cancel`,
    },
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
  const apiKey = process.env.INTTEGRO_API_KEY?.trim();
  if (!apiKey) {
    throw new DemoError('configuration_error', 'Set INTTEGRO_API_KEY on the server.');
  }

  const origin = configuredOrigin(requestOrigin);
  const inttegro = new InttegroClient({ apiKey });

  try {
    const order = await inttegro.orders.create(buildOrderRequest(input, origin));

    const checkoutUrl = order.invoice?.format?.web?.url;
    if (!checkoutUrl) {
      throw new DemoError('api_error', 'Inttegro did not return a hosted checkout URL.');
    }
    return { checkoutUrl, orderId: order.id };
  } catch (error) {
    if (error instanceof DemoError) throw error;
    if (error instanceof InttegroAPIError) {
      throw new DemoError('api_error', 'Inttegro rejected the checkout request.');
    }
    throw new DemoError('api_error', 'Checkout is temporarily unavailable.');
  }
}
