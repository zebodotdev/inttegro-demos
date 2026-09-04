import { NextRequest, NextResponse } from 'next/server';
import { createHostedCheckout, DemoError, parseCheckoutInput } from '@/lib/checkout';

export async function POST(request: NextRequest) {
  try {
    const input = parseCheckoutInput(await request.formData());
    const checkout = await createHostedCheckout(input, request.nextUrl.origin);
    const response = NextResponse.redirect(checkout.checkoutUrl, 303);
    response.cookies.set('inttegro_demo_order', checkout.orderId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      maxAge: 60 * 30,
      path: '/',
    });
    return response;
  } catch (error) {
    const safe = error instanceof DemoError
      ? error
      : new DemoError('api_error', 'Checkout is temporarily unavailable.');
    const url = new URL('/', request.url);
    url.searchParams.set('code', safe.code);
    url.searchParams.set('message', safe.message);
    return NextResponse.redirect(url, 303);
  }
}
