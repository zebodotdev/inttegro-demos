import Link from 'next/link';

export default function Complete() {
  return (
    <main className="result">
      <span className="resultMark">✓</span>
      <p className="eyebrow">BROWSER RETURNED</p>
      <h1>Thanks. Payment is being verified.</h1>
      <p>The redirect is a customer-experience signal, not proof of payment. Fulfillment must use authoritative server-side status.</p>
      <Link href="/">Run the demo again</Link>
    </main>
  );
}
