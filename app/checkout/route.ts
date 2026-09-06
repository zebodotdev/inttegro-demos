import { NextRequest, NextResponse } from 'next/server';
import { createHostedCheckout, DemoError, parseCheckoutInput } from '@/lib/checkout';

/**
 * INTTEGRO:FLOW [hosted-checkout] POST /checkout crosses from the merchant app
 * to hosted Inttegro Checkout. The detailed Order choices live in
 * lib/checkout.ts and https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
 * INTTEGRO:VERIFY [server-side-verification] The later /complete redirect is a
 * browser navigation signal, not proof of payment or authority to fulfill.
 */

export async function POST(request: NextRequest) {
  try {
    const input = parseCheckoutInput(await request.formData());
    const checkout = await createHostedCheckout(input, request.nextUrl.origin);
    // INTTEGRO:DECISION [see-other-redirect] 303 converts this form POST into a
    // GET to the hosted URL. Unlike 307/308, it cannot replay the form body to
    // the destination.
    const response = NextResponse.redirect(checkout.checkoutUrl, 303);

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
    const url = new URL('/', request.url);
    url.searchParams.set('code', safe.code);
    url.searchParams.set('message', safe.message);
    return NextResponse.redirect(url, 303);
  }
}
