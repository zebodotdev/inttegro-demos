import { describe, expect, it } from 'vitest';
import { buildOrderRequest, DemoError, parseCheckoutInput } from '../server/utils/checkout';

describe('Nuxt checkout', () => {
  it('rejects invalid input', () => {
    expect(() => parseCheckoutInput({ name: 'Akua', email: 'bad', phone: '+233', attempt_id: 'attempt_123' })).toThrow(DemoError);
  });

  it('builds the shared order request', () => {
    const request = buildOrderRequest({ name: 'Akua', email: 'akua@example.com', phone: '+233', attemptId: 'attempt_123' }, 'https://demo.example');
    expect(request.request_meta?.idempotency_key).toBe('demo-attempt_123');
    expect(request.finalize).toBe(true);
    const lineItem = request.line_items[0];
    expect(lineItem?.type).toBe('product');
    if (!lineItem || lineItem.type !== 'product') throw new Error('expected a product line item');
    expect(lineItem.product.price.value).toBe(5000);
  });
});
