import { NextRequest, NextResponse } from 'next/server';
import { createHostedCheckout, DemoError, parseCheckoutInput } from '@/lib/checkout';

/**
 * INTTEGRO:FLOW [checkout-presentation] POST /checkout creates one finalized
 * Order for hosted-page, embedded, and modal Inttegro Checkout. The detailed Order choices live in
 * lib/checkout.ts and https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
 * INTTEGRO:VERIFY [server-side-verification] The later /complete redirect is a
 * browser navigation signal, not proof of payment or authority to fulfill.
 */

export async function POST(request: NextRequest) {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;
  try {
    const input = parseCheckoutInput(await request.formData());
    const checkout = await createHostedCheckout(input, request.nextUrl.origin);
    const response = wantsJson
      // INTTEGRO:SECURITY [client-order-reference] The enhanced UI receives
      // only the finalized Order ID; credentials and commercial inputs stay here.
      ? NextResponse.json(
        { orderId: checkout.orderId },
        { status: 201, headers: { 'Cache-Control': 'no-store' } },
      )
      // INTTEGRO:DECISION [see-other-redirect] The no-JavaScript and hosted-page
      // path uses 303 so the browser follows with GET and never replays this body.
      : NextResponse.redirect(checkout.checkoutUrl, 303);

    // INTTEGRO:DECISION [durable-order-correlation] This short-lived HttpOnly
    // cookie illustrates server-readable correlation; it is not payment proof
    // or an authorization boundary. Production code persists a merchant-owned
    // order/cart -> Inttegro order mapping and validates its owner on return.
    // https://studio.inttegro.com/webhooks
    response.cookies.set('inttegro_demo_order', checkout.orderId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      maxAge: 60 * 30,
      path: '/',
    });
    return response;
  } catch (error) {
    // INTTEGRO:SECURITY [safe-error-boundary] Only our bounded public error
    // vocabulary reaches the query string. Log detailed diagnostics and request
    // IDs only in access-controlled server telemetry.
    const safe = error instanceof DemoError
      ? error
      : new DemoError('api_error', 'Checkout is temporarily unavailable.');
    if (wantsJson) {
      return NextResponse.json(
        { code: safe.code, message: safe.message },
        {
          status: safe.code === 'validation_error' ? 400 : 503,
          headers: { 'Cache-Control': 'no-store' },
        },
      );
    }
    const url = new URL('/', request.url);
    url.searchParams.set('code', safe.code);
    url.searchParams.set('message', safe.message);
    return NextResponse.redirect(url, 303);
  }
}
