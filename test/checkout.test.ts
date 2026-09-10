import assert from 'node:assert/strict';
import test from 'node:test';

import type { Product } from '@inttegro/inttegro-sdk';

import {
  buildOrderRequest,
  DemoError,
  parseCheckoutInput,
  selectCatalogProduct,
} from '../src/lib/checkout.js';

const product = {
  id: 'prod_openfield',
  active: true,
  type: 'service',
  name: 'Riverbend Learning Garden contribution',
  about: 'A contribution unit for the Openfield campaign.',
  reference: 'OPENFIELD-GARDEN',
  prices: [{
    id: 'pr_openfield',
    active: true,
    nominal: { currency: 'ghs', value: 5_000 },
  }],
} as unknown as Product;

test('validates and normalizes a public contribution', () => {
  const input = parseCheckoutInput({
    name: '  Akua Mensah ',
    email: ' akua@example.com ',
    phone: ' +233544998605 ',
    tier: 'grower',
    attempt_id: 'attempt_1234',
    ignored_price: '1',
  });
  assert.deepEqual(input, {
    name: 'Akua Mensah',
    email: 'akua@example.com',
    phone: '+233544998605',
    tier: 'grower',
    attemptId: 'attempt_1234',
  });
});

test('rejects an unrecognized contribution tier before calling Inttegro', () => {
  assert.throws(
    () => parseCheckoutInput({
      name: 'Akua Mensah',
      email: 'akua@example.com',
      phone: '+233544998605',
      tier: 'custom',
      attempt_id: 'attempt_1234',
    }),
    (error: unknown) => error instanceof DemoError && error.code === 'validation_error',
  );
});

test('builds a server-owned contribution order for the selected tier', () => {
  const input = parseCheckoutInput({
    name: 'Akua Mensah',
    email: 'akua@example.com',
    phone: '+233544998605',
    tier: 'steward',
    attempt_id: 'attempt_1234',
  });
  const selection = selectCatalogProduct(product, 'pr_openfield');
  const request = buildOrderRequest(input, 'https://astro-demo.inttegro.dev', selection);

  assert.equal(request.number, 'OPENFIELD-ATTEMPT-1234');
  assert.deepEqual(request.requestMeta, { idempotencyKey: 'demo-attempt_1234' });
  assert.equal(request.checkoutSettings?.redirectUrl, 'https://astro-demo.inttegro.dev/complete');
  assert.equal(request.checkoutSettings?.cancelUrl, 'https://astro-demo.inttegro.dev/cancel');
  assert.equal(
    request.lineItems[0]?.type === 'product' ? request.lineItems[0].product.quantity : undefined,
    5,
  );
});

test('requires the configured GHS 50 base contribution', () => {
  const wrongPrice = structuredClone(product) as Product;
  if (wrongPrice.prices?.[0]) wrongPrice.prices[0].nominal.value = 1;
  assert.throws(
    () => selectCatalogProduct(wrongPrice, 'pr_openfield'),
    (error: unknown) => error instanceof DemoError && error.code === 'configuration_error',
  );
});
