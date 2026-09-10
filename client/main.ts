import 'zone.js'

import { bootstrapApplication } from '@angular/platform-browser'

import { CheckoutFlowComponent } from './checkout-flow.component'

/**
 * INTTEGRO:DECISION [framework-adapter]
 * INTTEGRO:DOCS https://studio.inttegro.com/web/angular
 *
 * Angular mounts beside FastAPI's form instead of replacing the event page.
 * The component therefore demonstrates Angular lifecycle integration for
 * embedded and modal Checkout without sacrificing the server-rendered hosted
 * fallback or duplicating the Python order-creation boundary.
 */
const form = document.querySelector('[data-checkout-form]')
if (form instanceof HTMLFormElement) {
  const host = document.createElement('inttegro-demo-checkout')
  form.insertAdjacentElement('afterend', host)
  void bootstrapApplication(CheckoutFlowComponent).catch((error: unknown) => {
    console.error('Angular Checkout could not start.', error)
  })
}
