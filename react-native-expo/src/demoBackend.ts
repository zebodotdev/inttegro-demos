export interface CheckoutOrderResponse {
  orderId: string;
}

export function decodeCheckoutOrder(value: unknown): CheckoutOrderResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('orderId' in value) ||
    typeof value.orderId !== 'string' ||
    value.orderId.trim() === ''
  ) {
    throw new Error('The demo backend returned an invalid checkout order.');
  }
  return { orderId: value.orderId.trim() };
}

export async function createCheckoutOrder(
  attemptId: string
): Promise<CheckoutOrderResponse> {
  const backendURL = process.env.EXPO_PUBLIC_INTTEGRO_DEMO_BACKEND_URL?.trim();
  if (!backendURL) {
    throw new Error('Set EXPO_PUBLIC_INTTEGRO_DEMO_BACKEND_URL.');
  }

  const response = await fetch(new URL('/mobile/orders', backendURL), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ attemptId }),
  });
  if (!response.ok) {
    throw new Error('The demo backend could not create the checkout order.');
  }
  return decodeCheckoutOrder(await response.json());
}
