import { httpServerHandler } from 'cloudflare:node';
import { createApp } from './app.js';

// Cloudflare Static Assets serves files from public/ before this handler. The
// Express application therefore remains focused on the dynamic routes.
const app = createApp();
app.listen(3000);

export default httpServerHandler({ port: 3000 });
