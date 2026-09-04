import Link from 'next/link';

export default function Cancel() {
  return <main className="story-kora result-page"><section className="result-card"><span className="result-mark">←</span><p className="eyebrow">Checkout paused</p><h1>Your bag is still here.</h1><p>No payment completion was claimed. Return to Kora Market whenever you’re ready to try again.</p><Link className="primary-action" href="/">Return to your bag</Link></section></main>;
}
