export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  css: ['~~/assets/styles.css'],
  app: {
    head: {
      link: [{ rel: 'stylesheet', href: '/checkout-presentations.css' }],
      script: [
        { src: '/checkout-presentations.js', defer: true },
        { src: '/demo-ui.js', defer: true },
      ],
    },
  },
  runtimeConfig: {
    inttegroApiKey: '',
    demoPublicUrl: '',
    demoProductId: '',
    demoPriceId: '',
  },
  typescript: { typeCheck: true },
});
