const iconClose = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

for (const dialog of document.querySelectorAll('[data-cart-dialog]')) {
  const open = () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  for (const trigger of document.querySelectorAll('[data-cart-open]')) {
    trigger.addEventListener('click', open);
  }

  const close = dialog.querySelector('[data-cart-close]');
  if (close) {
    close.innerHTML = iconClose;
    close.addEventListener('click', () => dialog.close());
  }

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  if (dialog.hasAttribute('data-auto-open')) open();
}

for (const swatch of document.querySelectorAll('[data-swatch]')) {
  swatch.addEventListener('click', () => {
    for (const peer of swatch.parentElement.querySelectorAll('[data-swatch]')) {
      peer.setAttribute('aria-pressed', String(peer === swatch));
    }
    for (const label of document.querySelectorAll('[data-finish-label]')) {
      label.textContent = swatch.getAttribute('aria-label') || '';
    }
  });
}

for (const button of document.querySelectorAll('[data-copy-invoice]')) {
  button.addEventListener('click', async () => {
    await navigator.clipboard?.writeText('INV-2048');
    const previous = button.textContent;
    button.textContent = 'Copied';
    window.setTimeout(() => { button.textContent = previous; }, 1600);
  });
}

for (const form of document.querySelectorAll('[data-checkout-form]')) {
  form.addEventListener('submit', () => {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Opening secure checkout…';
  });
}
