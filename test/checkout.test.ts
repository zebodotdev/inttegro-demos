import assert from 'node:assert/strict';
import test from 'node:test';

import type { Product } from '@inttegro/inttegro-sdk';

import { buildOrderRequest, DemoError, parseCheckoutInput, selectCatalogProduct } from '../src/checkout.service.js';

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

test('validates the public contribution DTO', async () => {
  const input = await parseCheckoutInput({
    name: 'Akua Mensah',
    email: 'akua@example.com',
    phone: '+233544998605',
    tier: 'grower',
    attempt_id: 'attempt_1234',
    price: '1',
  });
  assert.equal(input.tier, 'grower');
});

test('rejects an unrecognized tier before calling Inttegro', async () => {
  await assert.rejects(
    parseCheckoutInput({
      name: 'Akua Mensah',
      email: 'akua@example.com',
      phone: '+233544998605',
      tier: 'custom',
      attempt_id: 'attempt_1234',
    }),
    (error: unknown) => error instanceof DemoError && error.code === 'validation_error',
  );
});

test('builds a server-owned contribution order with a readable number', async () => {
  const input = await parseCheckoutInput({
    name: 'Akua Mensah',
    email: 'akua@example.com',
    phone: '+233544998605',
    tier: 'steward',
    attempt_id: 'attempt_1234',
  });
  const selection = selectCatalogProduct(product, 'pr_openfield');
  const request = buildOrderRequest(input, 'https://nestjs-demo.inttegro.dev', selection);

  assert.equal(request.number, 'OPENFIELD-ATTEMPT-1234');
  assert.equal(request.lineItems[0]?.type === 'product' ? request.lineItems[0].product.quantity : undefined, 5);
  assert.deepEqual(request.requestMeta, { idempotencyKey: 'demo-attempt_1234' });
  assert.equal(request.checkoutSettings?.redirectUrl, 'https://nestjs-demo.inttegro.dev/complete');
});

test('requires the published GHS 50 base contribution', () => {
  const wrongPrice = structuredClone(product) as Product;
  if (wrongPrice.prices?.[0]) wrongPrice.prices[0].nominal.value = 1;
  assert.throws(
    () => selectCatalogProduct(wrongPrice, 'pr_openfield'),
    (error: unknown) => error instanceof DemoError && error.code === 'configuration_error',
  );
});
