function Mark() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27V13m0 6c-4.8 0-8-2.7-8-7.5 4.8 0 8 2.7 8 7.5Zm0-3.5c4.8 0 8-2.7 8-7.5-4.8 0-8 2.7-8 7.5Z" /></svg>;
}

export function Result({ kind }: { kind: 'complete' | 'cancel' | 'not-found' }) {
  const content = kind === 'complete'
    ? { eyebrow: 'Contribution received', title: 'You helped something take root.', copy: 'Openfield will count the contribution only after the server verifies authoritative payment status.', action: 'Return to the garden', mark: '✓', status: 'Verification in progress', next: 'After verification, your contribution joins the next published milestone update.' }
    : kind === 'cancel'
      ? { eyebrow: 'Checkout paused', title: 'Nothing was charged.', copy: 'The garden will be here when you are ready. Your contribution was not marked as complete.', action: 'Choose a contribution', mark: '←', status: 'Contribution not completed', next: 'Your selected contribution remains available when you return to the campaign.' }
      : { eyebrow: 'Page not found', title: 'This path is still unplanted.', copy: 'Return to the Riverbend campaign to see the project and its latest progress.', action: 'Visit the campaign', mark: '↗', status: 'Campaign still active', next: 'The project page has the latest funding total, field evidence, and build milestones.' };
  return <main className="result-page openfield-result-page"><section className="openfield-result"><header className="result-header"><a className="brand" href="/"><Mark /><span>openfield</span></a><span>Riverbend Learning Garden</span></header><div className="result-story"><span className="result-mark">{content.mark}</span><p className="chapter-number">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.copy}</p><a className="result-action" href="/">{content.action}<span>→</span></a></div><aside className="result-impact"><p className="chapter-number">What happens next</p><strong>{content.status}</strong><p>{content.next}</p><dl><div><dt>Campaign progress</dt><dd>73%</dd></div><div><dt>Next milestone</dt><dd>Six more growing beds</dd></div></dl></aside></section></main>;
}
