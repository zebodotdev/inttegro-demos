import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  plugins: [svelte()],
  build: {
    emptyOutDir: true,
    lib: {
      entry: 'client/main.ts',
      formats: ['es'],
      fileName: () => 'checkout.js',
    },
    outDir: 'public/svelte',
    sourcemap: true,
  },
})
