import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOrderRequest, DemoError, parseCheckoutInput } from '../src/checkout.js';
import { homePage } from '../src/pages.js';

test('rejects invalid customer input', () => {
  assert.throws(
    () => parseCheckoutInput({ name: 'Akua', email: 'not-email', phone: '+233', attempt_id: 'attempt_123' }),
    (error: unknown) => error instanceof DemoError && error.code === 'validation_error',
  );
});

test('builds the canonical hosted checkout request', () => {
  const request = buildOrderRequest({
    name: 'Akua Mensah', email: 'akua@example.com', phone: '+233544998605', attemptId: 'attempt_123',
  }, 'https://demo.example');
  assert.equal(request.request_meta?.idempotency_key, 'demo-attempt_123');
  assert.equal(request.finalize, true);
  assert.equal(request.checkout_settings?.redirect_url, 'https://demo.example/complete');
  const lineItem = request.line_items[0];
  if (!lineItem || lineItem.type !== 'product') assert.fail('expected a product line item');
  assert.equal(lineItem.product.name, 'Afterglow Sessions - Courtyard admission');
  assert.equal(lineItem.product.type, 'digital');
  assert.equal(lineItem.product.price.value, 5000);
});

test('renders configuration guidance and escapes untrusted query errors', () => {
  const setup = homePage('attempt_123', {
    code: 'configuration_error',
    message: 'Set INTTEGRO_API_KEY on the server.',
  });
  assert.match(setup, /Connect this copy to Inttegro/);
  assert.match(setup, /has-config-error/);

  const unsafe = homePage('attempt_123', {
    code: '<script>',
    message: '<img src=x onerror=alert(1)>',
  });
  assert.doesNotMatch(unsafe, /<script>|<img src=x/);
  assert.match(unsafe, /&lt;script&gt;/);
});
