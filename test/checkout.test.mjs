import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOrderRequest, parseCheckoutInput } from '../lib/checkout.ts';

test('rejects invalid customer input', () => {
  const form = new FormData();
  form.set('name', 'Akua');
  form.set('email', 'not-an-email');
  form.set('phone', '+233200000000');
  form.set('attempt_id', 'attempt_123');

  assert.throws(() => parseCheckoutInput(form), /valid email/);
});

test('builds the Kora Market Dawn Brew Set order', () => {
  const request = buildOrderRequest(
    {
      name: 'Akua',
      email: 'akua@example.com',
      phone: '+233200000000',
      attemptId: 'attempt_123',
    },
    'https://demo.example',
  );

  assert.equal(request.request_meta?.idempotency_key, 'demo-attempt_123');
  assert.equal(request.finalize, true);
  assert.equal(request.checkout_settings?.redirect_url, 'https://demo.example/complete');
  assert.equal(request.line_items?.[0]?.product?.name, 'Dawn Brew Set');
  assert.equal(request.line_items?.[0]?.product?.type, 'physical');
  assert.equal(request.line_items?.[0]?.product?.price.value, 5000);
});
