import { randomUUID } from 'node:crypto';

type HomeProps = { searchParams: Promise<{ code?: string; message?: string }> };

const CartIcon = () => (
  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 6h2l1.4 9.2a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 1.9-1.5L21 8H7" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" />
  </svg>
);

export default async function Home({ searchParams }: HomeProps) {
  const error = await searchParams;
  const attemptId = randomUUID();
  const needsConfiguration = error.code === 'configuration_error';

  return (
    <div className="story-kora">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Kora Market home"><span className="brand-mark">K</span>Kora Market</a>
        <nav className="header-nav" aria-label="Store navigation">
          <a href="#collection" aria-current="page">Collection</a><a href="#story">Our story</a>
          <button className="header-action" type="button" data-cart-open><CartIcon /> Bag · 1</button>
        </nav>
      </header>

      <main id="top" className="kora-main">
        <section className="kora-hero" aria-labelledby="product-title">
          <div className="kora-copy">
            <p className="eyebrow">New from the Volta studio</p>
            <h1 id="product-title">A slower, warmer morning.</h1>
            <p className="lede">The Dawn Brew Set is shaped and fired in small batches, pairing a sculptural pour-over with a cup designed to make the first ritual of the day feel considered.</p>
            <div className="kora-actions">
              <button className="primary-action" type="button" data-cart-open>Add to bag · GHS 50</button>
              <a className="secondary-action" href="#story">Meet the maker</a>
            </div>
            <div className="kora-proof"><div className="avatar-stack" aria-hidden="true"><span>AM</span><span>KO</span><span>YA</span></div><span>Loved by 240 thoughtful homes · 4.9 ★</span></div>
          </div>

          <div className="product-stage" id="collection">
            <div className="product-image-wrap"><img src="/kora-dawn-brew.jpg" alt="Terracotta pour-over coffee set with a small cup and natural linen" /></div>
            <div className="product-badge"><span className="status-dot" /> Ready to ship</div>
            <aside className="product-float" aria-label="Product summary">
              <div className="row"><span className="rating">★★★★★</span><strong className="price">GHS 50</strong></div>
              <h2>Dawn Brew Set</h2>
              <p className="microcopy">Hand-thrown stoneware · <span data-finish-label>Sunrise clay</span></p>
              <div className="swatches" aria-label="Choose finish">
                <button className="swatch" type="button" aria-label="Sunrise clay" aria-pressed="true" data-swatch /><button className="swatch" type="button" aria-label="Night earth" aria-pressed="false" data-swatch /><button className="swatch" type="button" aria-label="River sand" aria-pressed="false" data-swatch />
              </div>
            </aside>
          </div>
        </section>

        <section id="story" className="story-section" aria-labelledby="story-title">
          <div className="story-section-head"><div><p className="eyebrow">Made with intention</p><h2 id="story-title">From earth to everyday ritual.</h2></div><p className="microcopy">Designed by Ama Ofori · Ho, Ghana</p></div>
          <div className="story-grid">
            <article className="story-card"><span className="number">01 / FORM</span><h3>Thrown by hand, never rushed.</h3><p>Every silhouette keeps the small variations that make an object personal. No two sets land in quite the same way.</p></article>
            <article className="story-card"><span className="number">02 / MATERIAL</span><h3>Local clay</h3><p>A durable, food-safe finish with a naturally warm touch.</p></article>
            <article className="story-card"><span className="number">03 / DELIVERY</span><h3>Carefully packed</h3><p>Plastic-free materials and delivery across Ghana in 2–4 days.</p></article>
          </div>
        </section>
      </main>

      <dialog className="cart-dialog" data-cart-dialog {...(error.code ? { 'data-auto-open': '' } : {})}>
        <div className="cart-head"><h2>Your bag</h2><button className="icon-button" type="button" aria-label="Close bag" data-cart-close /></div>
        <div className="cart-body">
          {needsConfiguration ? (
            <section className="setup-card has-config-error" role="status">
              <span className="setup-kicker">Setup required</span>
              <h3>Connect this copy to Inttegro</h3>
              <p>Add <code>INTTEGRO_API_KEY</code> as a server-side test secret, set this deployment’s public URL, then redeploy. The key must never use a <code>NEXT_PUBLIC_</code> prefix.</p>
              <div className="setup-actions"><a href="https://studio.inttegro.com/keys">Create a test key</a><a href="https://github.com/zebodotdev/inttegro-demos/blob/nextjs-v1.1.0/nextjs/README.md#deploy-your-own">Deployment guide</a></div>
            </section>
          ) : error.code ? <p className="inline-error" role="alert"><strong>{error.code.replaceAll('_', ' ')}:</strong> {error.message || 'Checkout could not be started.'}</p> : null}
          <div className="cart-line"><img src="/kora-dawn-brew.jpg" alt="" /><div><div className="row"><h3>Dawn Brew Set</h3><strong>GHS 50</strong></div><p className="microcopy"><span data-finish-label>Sunrise clay</span> · Quantity 1</p></div></div>
          <div className="cart-total"><span>Total</span><strong>GHS 50.00</strong></div>
          <form className="checkout-form" action="/checkout" method="post" data-checkout-form>
            <input type="hidden" name="attempt_id" value={attemptId} />
            <div className="field-grid"><label>Full name<input name="name" defaultValue="Akua Mensah" autoComplete="name" required /></label><label>Email address<input name="email" type="email" defaultValue="akua@example.com" autoComplete="email" required /></label></div>
            <label>Phone number<input name="phone" type="tel" defaultValue="+233544998605" autoComplete="tel" required /></label>
            <button className="checkout-button" type="submit">Continue securely <span>→</span></button>
            <p className="secure-note">Secure checkout powered by Inttegro · API key remains server-side</p>
          </form>
        </div>
      </dialog>
    </div>
  );
}
