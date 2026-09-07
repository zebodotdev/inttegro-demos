import { initClient, initClientNavigation } from 'rwsdk/client';

const { handleResponse, onHydrated } = initClientNavigation();
initClient({ handleResponse, onHydrated });

const form = document.querySelector('[data-contribution-form]');
if (form instanceof HTMLFormElement) {
  const buttonLabel = form.querySelector('button span');
  const amounts: Record<string, string> = {
    seed: 'GHS 50',
    grower: 'GHS 100',
    steward: 'GHS 250',
  };
  const updateButton = () => {
    const selected = String(new FormData(form).get('tier') ?? '');
    if (buttonLabel) buttonLabel.textContent = `Contribute ${amounts[selected] ?? 'securely'}`;
  };

  form.addEventListener('change', (event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.name === 'tier') updateButton();
  });

  form.addEventListener('submit', () => {
    const button = form.querySelector('button');
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      if (buttonLabel) buttonLabel.textContent = 'Opening secure checkout…';
    }
  });

  window.addEventListener('pageshow', () => {
    const button = form.querySelector('button');
    if (button instanceof HTMLButtonElement) button.disabled = false;
    updateButton();
  });
}
