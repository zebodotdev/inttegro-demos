import { createHostedCheckout, DemoError, parseCheckoutInput } from '../utils/checkout';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Record<string, unknown>>(event);
    const input = parseCheckoutInput(body);
    const config = useRuntimeConfig(event);
    const requestOrigin = getRequestURL(event).origin;
    const result = await createHostedCheckout(input, config.inttegroApiKey, config.demoPublicUrl || requestOrigin);
    setCookie(event, 'inttegro_demo_order', result.orderId, { httpOnly: true, sameSite: 'lax', secure: requestOrigin.startsWith('https:'), maxAge: 1800, path: '/' });
    return sendRedirect(event, result.checkoutUrl, 303);
  } catch (error) {
    const safe = error instanceof DemoError ? error : new DemoError('api_error', 'Checkout is temporarily unavailable.');
    return sendRedirect(event, `/?${new URLSearchParams({ code: safe.code, message: safe.message })}`, 303);
  }
});
