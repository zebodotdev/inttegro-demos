import { randomUUID } from 'node:crypto';

type HomeProps = { searchParams: Promise<{ code?: string; message?: string }> };

export default async function Home({ searchParams }: HomeProps) {
  const error = await searchParams;
  const attemptId = randomUUID();

  return (
    <main className="shell">
      <section className="intro">
        <span className="eyebrow">INTTEGRO × NEXT.JS</span>
        <h1>One clean handoff to checkout.</h1>
        <p>
          This app creates a finalized order on the server, then redirects to the
          secure checkout URL returned by Inttegro.
        </p>
        <dl>
          <div><dt>Amount</dt><dd>GHS 50.00</dd></div>
          <div><dt>Integration</dt><dd>Hosted checkout</dd></div>
          <div><dt>Credential</dt><dd>Server only</dd></div>
        </dl>
      </section>

      <section className="card">
        <div>
          <span className="step">Demo order</span>
          <h2>Integration workshop</h2>
          <p className="muted">A fixed digital item keeps every framework demo comparable.</p>
        </div>

        {error.code ? (
          <div className="error" role="alert">
            <strong>{error.code.replaceAll('_', ' ')}</strong>
            <span>{error.message || 'Checkout could not be started.'}</span>
          </div>
        ) : null}

        <form action="/checkout" method="post">
          <input type="hidden" name="attempt_id" value={attemptId} />
          <label>Name<input name="name" defaultValue="Akua Mensah" autoComplete="name" required /></label>
          <label>Email<input name="email" type="email" defaultValue="akua@example.com" autoComplete="email" required /></label>
          <label>Phone<input name="phone" type="tel" defaultValue="+233544998605" autoComplete="tel" required /></label>
          <button type="submit">Continue to Inttegro <span>→</span></button>
        </form>
        <p className="fine">Your API key stays in the Next.js server runtime.</p>
      </section>
    </main>
  );
}
