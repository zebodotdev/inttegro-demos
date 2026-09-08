import { randomUUID } from 'node:crypto';
import express from 'express';
import { createHostedCheckout, DemoError, parseCheckoutInput } from './checkout.js';
import { homePage, resultPage } from './pages.js';

/**
 * INTTEGRO:FLOW [checkout-presentation] POST /checkout creates the same
 * finalized Order for hosted-page, embedded, and modal Checkout, documented at
 * https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
 * INTTEGRO:VERIFY [server-side-verification] /complete is not authoritative
 * payment evidence. Verify with a server-side order lookup and reconciliation:
 * https://studio.inttegro.com/webhooks.
 *
 * Build the transport-independent Express application. Node and Cloudflare use
 * separate entry points so this file remains an ordinary Express example; the
 * adapter is deployment plumbing rather than part of the Inttegro boundary.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  app.get('/', (request, response) => {
    const code = typeof request.query.code === 'string' ? request.query.code : '';
    const message = typeof request.query.message === 'string' ? request.query.message : '';
    response.type('html').send(homePage(randomUUID(), code ? { code, message } : undefined));
  });

  app.post('/checkout', async (request, response) => {
    const wantsJson = request.headers.accept?.includes('application/json') ?? false;
    if (wantsJson) response.set('Cache-Control', 'no-store');
    try {
      const input = parseCheckoutInput(request.body as Record<string, unknown>);
      const result = await createHostedCheckout(input, `${request.protocol}://${request.get('host')}`);
      // INTTEGRO:DECISION [durable-order-correlation] This HttpOnly cookie is only
      // an illustrative correlation aid. A production database must bind the
      // merchant reservation, owner, Inttegro order, and idempotency key.
      response.cookie('inttegro_demo_order', result.orderId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: request.secure,
        maxAge: 30 * 60 * 1000,
      });
      if (wantsJson) {
        // INTTEGRO:SECURITY [client-order-reference] The browser receives only the
        // finalized Order ID. Secret credentials and authoritative inputs stay
        // behind this route for both inline and modal Checkout.
        response.status(201).json({ orderId: result.orderId });
      } else {
        // INTTEGRO:DECISION [see-other-redirect] 303 follows the hosted URL with GET;
        // 307/308 would preserve POST and risk forwarding the merchant form body.
        response.redirect(303, result.checkoutUrl);
      }
    } catch (error) {
      // INTTEGRO:SECURITY [safe-error-boundary] Only bounded public messages reach
      // the query string. Detailed SDK errors remain in protected server telemetry.
      const safe = error instanceof DemoError
        ? error
        : new DemoError('api_error', 'Checkout is temporarily unavailable.');
      if (wantsJson) {
        response.status(safe.code === 'validation_error' ? 400 : 503).json({
          code: safe.code,
          message: safe.message,
        });
        return;
      }
      const query = new URLSearchParams({ code: safe.code, message: safe.message });
      response.redirect(303, `/?${query}`);
    }
  });

  app.get('/complete', (_request, response) => response.type('html').send(resultPage('complete')));
  app.get('/cancel', (_request, response) => response.type('html').send(resultPage('cancel')));
  app.get('/health', (_request, response) => response.json({ status: 'ok', demo: 'express' }));

  return app;
}
