import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCheckoutOrder,
  decodeCheckoutOrder,
} from '../src/demoBackend.ts';

test('rejects a response without a checkout order ID', () => {
  assert.throws(
    () => decodeCheckoutOrder({ orderId: '  ' }),
    /invalid checkout order/,
  );
});

test('requests the Kora Market Dawn Brew Set from the demo backend', async (t) => {
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
    assert.equal(input.href, 'https://demo.example/mobile/orders');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { attemptId: 'rn_attempt_123' });
    return new Response(
      JSON.stringify({ orderId: 'or_from_backend' }),
      { status: 200 },
    );
  });

  assert.deepEqual(await createCheckoutOrder('rn_attempt_123'), {
    orderId: 'or_from_backend',
  });
});
