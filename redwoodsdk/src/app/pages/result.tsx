function Mark() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27V13m0 6c-4.8 0-8-2.7-8-7.5 4.8 0 8 2.7 8 7.5Zm0-3.5c4.8 0 8-2.7 8-7.5-4.8 0-8 2.7-8 7.5Z" /></svg>;
}

export function Result({ kind }: { kind: 'complete' | 'cancel' | 'not-found' }) {
  const content = kind === 'complete'
    ? { eyebrow: 'Contribution received', title: 'You helped something take root.', copy: 'Openfield will count the contribution only after the server verifies authoritative payment status.', action: 'Return to the garden', mark: '✓' }
    : kind === 'cancel'
      ? { eyebrow: 'Checkout paused', title: 'Nothing was charged.', copy: 'The garden will be here when you are ready. Your contribution was not marked as complete.', action: 'Choose a contribution', mark: '←' }
      : { eyebrow: 'Page not found', title: 'This path is still unplanted.', copy: 'Return to the Riverbend campaign to see the project and its latest progress.', action: 'Visit the campaign', mark: '↗' };
  return <main className="result-page"><section><a className="brand" href="/"><Mark /><span>openfield</span></a><span className="result-mark">{content.mark}</span><p className="chapter-number">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.copy}</p><a className="result-action" href="/">{content.action}<span>→</span></a></section></main>;
}
