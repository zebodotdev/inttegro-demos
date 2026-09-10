import type { APIRoute } from 'astro';

import { createHostedCheckout, DemoError } from '../lib/checkout.js';

export const prerender = false;

/**
 * INTTEGRO:FLOW [checkout-presentation] One Astro server endpoint creates the
 * same finalized Order for hosted-page, embedded, and modal Checkout described
 * at https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;

  try {
    const checkout = await createHostedCheckout(await request.formData(), request.url);

    // INTTEGRO:DECISION [durable-order-correlation] This short-lived HttpOnly
    // cookie demonstrates server-readable correlation. It is neither proof of
    // ownership nor payment; production code persists an authorized cart-to-
    // Order mapping and verifies the Order before fulfillment.
    // https://studio.inttegro.com/webhooks
    cookies.set('inttegro_demo_order', checkout.orderId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: new URL(request.url).protocol === 'https:',
      maxAge: 60 * 30,
      path: '/',
    });

    if (wantsJson) {
      // INTTEGRO:SECURITY [client-order-reference] Browser Checkout receives
      // only its finalized Order ID. Credentials, catalogue authority, contact
      // inputs, totals, and the hosted invoice URL stay on the server.
      return Response.json(
        { orderId: checkout.orderId },
        { status: 201, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    // INTTEGRO:DECISION [see-other-redirect] 303 follows the form POST with GET;
    // 307 and 308 could replay the supporter body at the Checkout destination.
    return new Response(null, {
      status: 303,
      headers: { Location: checkout.checkoutUrl },
    });
  } catch (error) {
    // INTTEGRO:SECURITY [safe-error-boundary] Only this bounded public error
    // vocabulary crosses the HTTP boundary. Raw SDK errors, request bodies,
    // credentials, and upstream payloads remain in controlled server telemetry.
    const safe = error instanceof DemoError
      ? error
      : new DemoError('api_error', 'Contributions are temporarily unavailable.');

    if (wantsJson) {
      return Response.json(
        { code: safe.code, message: safe.message },
        {
          status: safe.code === 'validation_error' ? 400 : 503,
          headers: { 'Cache-Control': 'no-store' },
        },
      );
    }

    const returnUrl = new URL('/', request.url);
    returnUrl.searchParams.set('code', safe.code);
    returnUrl.searchParams.set('message', safe.message);
    return new Response(null, { status: 303, headers: { Location: returnUrl.toString() } });
  }
};
