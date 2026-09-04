import { NextRequest, NextResponse } from 'next/server';
import {
  createMobileCheckout,
  DemoError,
  parseMobileCheckoutInput,
} from '@/lib/checkout';

export async function POST(request: NextRequest) {
  try {
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
