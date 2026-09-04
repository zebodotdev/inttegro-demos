import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMobileOrderRequest,
  buildOrderRequest,
  parseCheckoutInput,
  parseMobileCheckoutInput,
} from '../lib/checkout.ts';

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

test('accepts only a client-generated mobile checkout attempt ID', () => {
  assert.deepEqual(
    parseMobileCheckoutInput({ attemptId: ' mobile_attempt_123 ' }),
    { attemptId: 'mobile_attempt_123' },
  );
  assert.throws(
    () => parseMobileCheckoutInput({
      attemptId: 'mobile_attempt_123',
      item: { value: 1 },
    }),
    /valid mobile checkout attempt ID/,
  );
});

test('builds a finalized mobile-money-only order on the server', () => {
  const request = buildMobileOrderRequest(
    { attemptId: 'mobile_attempt_123' },
    'cus_demo',
  );

  assert.equal(request.request_meta?.idempotency_key, 'mobile-demo-mobile_attempt_123');
  assert.equal(request.customer_id, 'cus_demo');
  assert.equal(request.finalize, true);
  assert.deepEqual(request.payment_method_types, ['mobile_money']);
  assert.equal(request.line_items?.[0]?.product?.name, 'Dawn Brew Set');
  assert.equal(request.line_items?.[0]?.product?.price.value, 5000);
});
