export interface CheckoutOrderResponse {
  orderId: string;
}

/**
 * Inttegro mobile integration boundary
 *
 * INTTEGRO:FLOW [mobile-backend-boundary] The app asks a trusted merchant
 * backend to create and finalize an Order, then receives only the order ID the
 * Inttegro SDK needs.
 * INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY must never use an
 * EXPO_PUBLIC_* variable, app.json extra, source constant, or embedded asset.
 * JavaScript bundles are inspectable. Products, prices, customers, and payment
 * policy stay on the server.
 * INTTEGRO:ALTERNATIVE [mobile-backend-boundary] An existing authenticated API
 * gateway or backend-for-frontend can implement this operation; the reference
 * Next.js route is just one option.
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 * See ../../INTEGRATION_GUIDE.md and ../../integration-decisions.json for the shared
 * rationale and machine-readable alternatives.
 */

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

  // INTTEGRO:SECURITY [mobile-backend-boundary] This demo sends only an opaque
  // attempt ID. Production must authenticate the user, authorize and recompute
  // the cart server-side, apply rate limits, and consider platform attestation.
  // Never trust client-selected customer, product, amount, or currency.
  const response = await fetch(new URL('/mobile/orders', backendURL), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ attemptId }),
  });
  if (!response.ok) {
    throw new Error('The demo backend could not create the checkout order.');
  }
  // INTTEGRO:DECISION [mobile-backend-boundary] Accept only the minimal orderId
  // projection. Merchant credentials and commercial state never cross the
  // backend authorization boundary.
  return decodeCheckoutOrder(await response.json());
}
