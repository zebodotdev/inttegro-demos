import { env } from 'cloudflare:workers';
import { render, route } from 'rwsdk/router';
import { defineApp } from 'rwsdk/worker';

import { Document } from '@/app/document';
import { Home } from '@/app/pages/home';
import { Result } from '@/app/pages/result';
import { createHostedCheckout, DemoError } from '@/checkout';

export type AppContext = {};

// INTTEGRO:FLOW [hosted-checkout] Routes keep the Worker HTTP boundary
// separate from the integration service. The hosted handoff is documented at
// https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
const redirectToError = (requestUrl: string, error: DemoError) => {
  const target = new URL('/', requestUrl);
  target.searchParams.set('code', error.code);
  target.searchParams.set('message', error.message);
  return new Response(null, { status: 303, headers: { Location: target.toString() } });
};

export default defineApp([
  ({ response }) => {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
  },
  render(Document, [
    route('/', ({ request }) => {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const message = url.searchParams.get('message');
      return <Home
        attemptId={crypto.randomUUID().replaceAll('-', '')}
        {...(code && message ? { error: { code, message } } : {})}
      />;
    }),
    route('/checkout', {
      post: async ({ request }) => {
        try {
          const result = await createHostedCheckout(await request.formData(), request.url, env);
          // INTTEGRO:DECISION [see-other-redirect] 303 converts the form POST to
          // a GET at the Inttegro URL and avoids replaying supporter details.
          return new Response(null, {
            status: 303,
            headers: {
              Location: result.checkoutUrl,
              'Set-Cookie': `inttegro_demo_order=${encodeURIComponent(result.orderId)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800`,
            },
          });
        } catch (error) {
          return redirectToError(
            request.url,
            error instanceof DemoError ? error : new DemoError('api_error', 'Contributions are temporarily unavailable.'),
          );
        }
      },
    }),
    route('/complete', () => {
      // INTTEGRO:VERIFY [server-side-verification] A browser return is not
      // authoritative payment evidence. Count support only from verified
      // server-side payment/order state.
      return <Result kind="complete" />;
    }),
    route('/cancel', () => <Result kind="cancel" />),
    route('/health', () => Response.json({ status: 'ok', demo: 'redwoodsdk' })),
    route('*', () => <Result kind="not-found" />),
  ]),
]);
