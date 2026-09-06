export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  css: ['~~/assets/styles.css'],
  runtimeConfig: {
    inttegroApiKey: '',
    demoPublicUrl: '',
    demoProductId: '',
    demoPriceId: '',
  },
  typescript: { typeCheck: true },
});
