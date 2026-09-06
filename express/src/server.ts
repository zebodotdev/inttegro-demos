import path from 'node:path';
import express from 'express';
import { createApp } from './app.js';

/**
 * INTTEGRO:FLOW [hosted-checkout] POST /checkout is the browser-to-hosted-
 * checkout handoff. Order construction is documented in checkout.ts and at
 * https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
 * INTTEGRO:VERIFY [server-side-verification] /complete is not authoritative
 * payment evidence. Verify with a server-side order lookup and reconcile
 * non-terminal orders: https://studio.inttegro.com/webhooks.
 */

const app = createApp();
app.use(express.static(path.resolve(process.cwd(), 'public')));

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`Inttegro Express demo listening on http://localhost:${port}`));
