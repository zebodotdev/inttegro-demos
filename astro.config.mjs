import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone', bodySizeLimit: 64 * 1024 }),
  security: {
    checkOrigin: true,
    allowedDomains: [
      {
        protocol: 'https',
        hostname: 'astro-demo.inttegro.dev',
      },
    ],
  },
  server: {
    host: true,
    port: 3014,
  },
});
