const form = document.querySelector('[data-contribution-form]');

if (form instanceof HTMLFormElement) {
  const buttonLabel = form.querySelector('button span');
  const amounts = { seed: 'GHS 50', grower: 'GHS 100', steward: 'GHS 250' };
  const updateButton = () => {
    const selected = new FormData(form).get('tier');
    if (buttonLabel) buttonLabel.textContent = `Contribute ${amounts[selected] ?? 'securely'}`;
  };

  form.addEventListener('change', (event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.name === 'tier') updateButton();
  });

  window.addEventListener('pageshow', () => {
    const button = form.querySelector('button');
    if (button instanceof HTMLButtonElement) button.disabled = false;
    updateButton();
  });
}
