export interface PaymentSessionResponse {
  paymentSessionSecret: string;
}

export function decodePaymentSession(value: unknown): PaymentSessionResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('paymentSessionSecret' in value) ||
    typeof value.paymentSessionSecret !== 'string' ||
    value.paymentSessionSecret.trim() === ''
  ) {
    throw new Error('The demo backend returned an invalid payment session.');
  }
  return { paymentSessionSecret: value.paymentSessionSecret.trim() };
}

export async function createPaymentSession(): Promise<PaymentSessionResponse> {
  const backendURL = process.env.EXPO_PUBLIC_INTTEGRO_DEMO_BACKEND_URL?.trim();
  if (!backendURL) {
    throw new Error('Set EXPO_PUBLIC_INTTEGRO_DEMO_BACKEND_URL.');
  }

  const response = await fetch(new URL('/mobile/payment-sessions', backendURL), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      item: {
        name: 'Inttegro integration workshop',
        type: 'digital',
        quantity: 1,
        currency: 'GHS',
        value: 5000,
      },
    }),
  });
  if (!response.ok) {
    throw new Error('The demo backend could not create a payment session.');
  }
  return decodePaymentSession(await response.json());
}
