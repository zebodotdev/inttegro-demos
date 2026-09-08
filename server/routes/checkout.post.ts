import { createHostedCheckout, DemoError, parseCheckoutInput } from '../utils/checkout';

/**
 * INTTEGRO:FLOW [checkout-presentation] This server handler creates the same
 * finalized Order for Kora Market's three Checkout presentations documented at
 * https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
 * INTTEGRO:VERIFY [server-side-verification] A return to /complete is not proof
 * of payment. Look up the order on a trusted server before fulfillment; current
 * reconciliation guidance is at https://studio.inttegro.com/webhooks.
 */

export default defineEventHandler(async (event) => {
  const wantsJson = getHeader(event, 'accept')?.includes('application/json') ?? false;
  if (wantsJson) setHeader(event, 'Cache-Control', 'no-store');
  try {
    const body = await readBody<Record<string, unknown>>(event);
    const input = parseCheckoutInput(body);
    const config = useRuntimeConfig(event);
    const requestOrigin = getRequestURL(event).origin;
    const result = await createHostedCheckout(
      input,
      config.inttegroApiKey,
      config.demoPublicUrl || requestOrigin,
      config.demoProductId,
      config.demoPriceId,
    );
    // INTTEGRO:DECISION [durable-order-correlation] This cookie is a compact demo
    // aid, not ownership or payment evidence. Persist the merchant order,
    // Inttegro order ID, owner, and idempotency key together in production.
    setCookie(event, 'inttegro_demo_order', result.orderId, { httpOnly: true, sameSite: 'lax', secure: requestOrigin.startsWith('https:'), maxAge: 1800, path: '/' });
    if (wantsJson) {
      // INTTEGRO:SECURITY [client-order-reference] The browser receives only
      // the finalized Order ID; secrets and authoritative totals stay here.
      setResponseStatus(event, 201);
      return { orderId: result.orderId };
    }
    // INTTEGRO:DECISION [see-other-redirect] 303 follows with GET, so the form
    // body is not replayed to Inttegro as it could be with 307/308.
    return sendRedirect(event, result.checkoutUrl, 303);
  } catch (error) {
    // INTTEGRO:SECURITY [safe-error-boundary] Only bounded demo errors enter the
    // query string; raw upstream responses remain server-side.
    const safe = error instanceof DemoError ? error : new DemoError('api_error', 'Checkout is temporarily unavailable.');
    if (wantsJson) {
      setResponseStatus(event, safe.code === 'validation_error' ? 400 : 503);
      return { code: safe.code, message: safe.message };
    }
    return sendRedirect(event, `/?${new URLSearchParams({ code: safe.code, message: safe.message })}`, 303);
  }
});
