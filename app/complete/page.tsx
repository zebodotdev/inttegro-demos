import Link from 'next/link';

export default function Complete() {
  return <main className="story-kora result-page"><section className="result-card"><span className="result-mark">✓</span><p className="eyebrow">Order received</p><h1>We’re confirming your payment.</h1><p>Your Dawn Brew Set is reserved. Kora Market will fulfill it only after the server verifies the authoritative payment status.</p><Link className="primary-action" href="/">Back to Kora Market</Link></section></main>;
}
