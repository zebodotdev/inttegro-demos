const page = (body: string, title = 'Inttegro × Express') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><link rel="stylesheet" href="/styles.css"></head><body>${body}</body></html>`;

export function homePage(attemptId: string, error?: { code: string; message: string }) {
  const alert = error ? `<div class="error" role="alert"><strong>${error.code.replaceAll('_', ' ')}</strong><span>${error.message}</span></div>` : '';
  return page(`<main class="shell"><section class="intro"><span class="eyebrow">INTTEGRO × EXPRESS</span><h1>A small server. A complete checkout.</h1><p>Express validates one form, creates an order with the official SDK, and hands the browser to Inttegro.</p><dl><div><dt>Amount</dt><dd>GHS 50.00</dd></div><div><dt>Runtime</dt><dd>Node.js 24</dd></div></dl></section><section class="card"><span class="step">Demo order</span><h2>Integration workshop</h2><p class="muted">The API key exists only in the Express process.</p>${alert}<form action="/checkout" method="post"><input type="hidden" name="attempt_id" value="${attemptId}"><label>Name<input name="name" value="Akua Mensah" autocomplete="name" required></label><label>Email<input type="email" name="email" value="akua@example.com" autocomplete="email" required></label><label>Phone<input type="tel" name="phone" value="+233544998605" autocomplete="tel" required></label><button>Continue to Inttegro <span>→</span></button></form></section></main>`);
}

export function resultPage(kind: 'complete' | 'cancel') {
  const complete = kind === 'complete';
  return page(`<main class="result"><span class="resultMark ${complete ? '' : 'neutral'}">${complete ? '✓' : '×'}</span><p class="eyebrow">${complete ? 'BROWSER RETURNED' : 'CHECKOUT CANCELED'}</p><h1>${complete ? 'Payment is being verified.' : 'No completion was claimed.'}</h1><p>${complete ? 'The redirect is not proof of payment. Fulfill only from authoritative server-side status.' : 'The customer can safely begin a fresh checkout attempt.'}</p><a href="/">Return to the demo</a></main>`, complete ? 'Checkout returned' : 'Checkout canceled');
}
