import Link from 'next/link';

export default function Cancel() {
  return (
    <main className="result">
      <span className="resultMark neutral">×</span>
      <p className="eyebrow">CHECKOUT CANCELED</p>
      <h1>No completion was claimed.</h1>
      <p>The order remains server-side. Start a fresh checkout attempt whenever the customer is ready.</p>
      <Link href="/">Return to the demo</Link>
    </main>
  );
}
