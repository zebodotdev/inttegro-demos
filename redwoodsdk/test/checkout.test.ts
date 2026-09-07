import assert from 'node:assert/strict';
import test from 'node:test';

import type { Product } from '@inttegro/inttegro-sdk';

import { buildOrderRequest, DemoError, parseCheckoutInput, selectCatalogProduct } from '../src/checkout.js';

const product = {
  id: 'prod_openfield', active: true, type: 'service',
  name: 'Riverbend Learning Garden contribution',
  about: 'A contribution unit for the Openfield campaign.',
  reference: 'OPENFIELD-GARDEN',
  prices: [{ id: 'pr_openfield', active: true, nominal: { currency: 'ghs', value: 5_000 } }],
} as unknown as Product;

test('parses a bounded contribution from FormData', () => {
  const form = new FormData();
  form.set('name', 'Akua Mensah');
  form.set('email', 'akua@example.com');
  form.set('phone', '+233544998605');
  form.set('tier', 'grower');
  form.set('attempt_id', 'attempt_1234');
  assert.equal(parseCheckoutInput(form).tier, 'grower');
});

test('rejects arbitrary public contribution tiers', () => {
  assert.throws(
    () => parseCheckoutInput({ name: 'Akua', email: 'akua@example.com', phone: '+233544998605', tier: 'custom', attempt_id: 'attempt_1234' }),
    (error: unknown) => error instanceof DemoError && error.code === 'validation_error',
  );
});

test('uses the catalogue unit and server-owned tier quantity', () => {
  const input = parseCheckoutInput({ name: 'Akua Mensah', email: 'akua@example.com', phone: '+233544998605', tier: 'steward', attempt_id: 'attempt_1234' });
  const request = buildOrderRequest(input, 'https://redwoodsdk-demo.inttegro.dev', selectCatalogProduct(product, 'pr_openfield'));
  assert.equal(request.number, 'OPENFIELD-ATTEMPT-1234');
  assert.equal(request.lineItems[0]?.type === 'product' ? request.lineItems[0].product.quantity : undefined, 5);
  assert.equal(request.customData?.contributionTier, 'steward');
});
