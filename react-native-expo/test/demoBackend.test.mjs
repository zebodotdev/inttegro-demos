import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPaymentSession,
  decodePaymentSession,
} from '../src/demoBackend.ts';

test('rejects a response without a payment-session secret', () => {
  assert.throws(
    () => decodePaymentSession({ paymentSessionSecret: '  ' }),
    /invalid payment session/,
  );
});

test('requests the shared workshop order from the demo backend', async (t) => {
  const previousBackendURL = process.env.EXPO_PUBLIC_INTTEGRO_DEMO_BACKEND_URL;
  process.env.EXPO_PUBLIC_INTTEGRO_DEMO_BACKEND_URL = 'https://demo.example';
  t.after(() => {
    if (previousBackendURL === undefined) {
      delete process.env.EXPO_PUBLIC_INTTEGRO_DEMO_BACKEND_URL;
    } else {
      process.env.EXPO_PUBLIC_INTTEGRO_DEMO_BACKEND_URL = previousBackendURL;
    }
  });
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    assert.equal(input.href, 'https://demo.example/mobile/payment-sessions');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), {
      item: {
        name: 'Inttegro integration workshop',
        type: 'digital',
        quantity: 1,
        currency: 'GHS',
        value: 5000,
      },
    });
    return new Response(
      JSON.stringify({ paymentSessionSecret: 'ps_from_backend' }),
      { status: 200 },
    );
  });

  assert.deepEqual(await createPaymentSession(), {
    paymentSessionSecret: 'ps_from_backend',
  });
});
