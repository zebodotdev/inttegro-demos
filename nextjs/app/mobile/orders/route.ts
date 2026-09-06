import { NextRequest, NextResponse } from 'next/server';
import {
  createMobileCheckout,
  DemoError,
  parseMobileCheckoutInput,
} from '@/lib/checkout';

/**
 * Reference merchant-backend endpoint for SwiftUI, Compose, Flutter, and React
 * Native.
 *
 * INTTEGRO:SECURITY [mobile-backend-boundary] A production version must
 * authenticate the app user, authorize the cart, apply rate limits, and derive
 * customer/product/price on the server. This demo accepts only an opaque
 * attemptId and returns only { orderId }; INTTEGRO_API_KEY never crosses the
 * boundary.
 * INTTEGRO:ALTERNATIVE [mobile-backend-boundary] Put the same operation in an
 * existing backend-for-frontend or API gateway; Next.js is not required.
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 */

export async function POST(request: NextRequest) {
  try {
    // Reject unknown keys so an app cannot make price, customer, product, or
    // payment-method policy look client-controlled by adding fields.
    const input = parseMobileCheckoutInput(await request.json());
    return NextResponse.json(await createMobileCheckout(input), { status: 201 });
  } catch (error) {
    const safe = error instanceof DemoError
      ? error
      : new DemoError('validation_error', 'Send a valid mobile checkout request.');
    const status = safe.code === 'validation_error'
      ? 400
      : safe.code === 'configuration_error'
        ? 500
        : 502;
    return NextResponse.json(
      { error: { code: safe.code, message: safe.message } },
      { status },
    );
  }
}
