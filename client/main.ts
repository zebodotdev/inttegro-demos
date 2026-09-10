import { mount } from 'svelte'

import CheckoutFlow from './CheckoutFlow.svelte'

/**
 * INTTEGRO:DECISION [framework-adapter]
 * INTTEGRO:DOCS https://studio.inttegro.com/web/svelte
 *
 * Svelte mounts beside the server-rendered contribution form instead of
 * replacing the whole campaign. This keeps NestJS's accessible HTML and
 * no-JavaScript hosted-page submission intact while giving the Svelte adapter
 * full ownership of embedded and modal Checkout lifecycle.
 */
const form = document.querySelector('[data-contribution-form]')
if (form instanceof HTMLFormElement) {
  const host = document.createElement('div')
  host.dataset.inttegroSvelteRoot = ''
  form.insertAdjacentElement('afterend', host)
  mount(CheckoutFlow, { target: host })
}
