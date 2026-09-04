import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createHostedCheckout, DemoError, parseCheckoutInput } from './checkout.js';
import { homePage, resultPage } from './pages.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.static(path.resolve(here, '../public')));

app.get('/', (request, response) => {
  const code = typeof request.query.code === 'string' ? request.query.code : '';
  const message = typeof request.query.message === 'string' ? request.query.message : '';
  response.type('html').send(homePage(randomUUID(), code ? { code, message } : undefined));
});

app.post('/checkout', async (request, response) => {
  try {
    const input = parseCheckoutInput(request.body as Record<string, unknown>);
    const result = await createHostedCheckout(input, `${request.protocol}://${request.get('host')}`);
    response.cookie('inttegro_demo_order', result.orderId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.secure,
      maxAge: 30 * 60 * 1000,
    });
    response.redirect(303, result.checkoutUrl);
  } catch (error) {
    const safe = error instanceof DemoError
      ? error
      : new DemoError('api_error', 'Checkout is temporarily unavailable.');
    const query = new URLSearchParams({ code: safe.code, message: safe.message });
    response.redirect(303, `/?${query}`);
  }
});

app.get('/complete', (_request, response) => response.type('html').send(resultPage('complete')));
app.get('/cancel', (_request, response) => response.type('html').send(resultPage('cancel')));
app.get('/health', (_request, response) => response.json({ status: 'ok', demo: 'express' }));

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`Inttegro Express demo listening on http://localhost:${port}`));
