<script setup lang="ts">
const route = useRoute();
const attemptId = useState('attempt-id', () => crypto.randomUUID());
const errorCode = computed(() => typeof route.query.code === 'string' ? route.query.code : '');
const errorMessage = computed(() => typeof route.query.message === 'string' ? route.query.message : '');
</script>

<template>
  <main class="shell">
    <section class="intro">
      <span class="eyebrow">INTTEGRO × NUXT</span>
      <h1>Checkout, in the Vue way.</h1>
      <p>Nuxt keeps the API key in Nitro, creates the order server-side, and returns only an Inttegro-hosted destination.</p>
      <dl><div><dt>Amount</dt><dd>GHS 50.00</dd></div><div><dt>Rendering</dt><dd>Vue SSR</dd></div></dl>
    </section>
    <section class="card">
      <span class="step">Demo order</span><h2>Integration workshop</h2>
      <p class="muted">One fixed product. One comparable integration.</p>
      <div v-if="errorCode" class="error" role="alert"><strong>{{ errorCode.replaceAll('_', ' ') }}</strong><span>{{ errorMessage || 'Checkout could not be started.' }}</span></div>
      <form action="/checkout" method="post">
        <input type="hidden" name="attempt_id" :value="attemptId">
        <label>Name<input name="name" value="Akua Mensah" autocomplete="name" required></label>
        <label>Email<input name="email" type="email" value="akua@example.com" autocomplete="email" required></label>
        <label>Phone<input name="phone" type="tel" value="+233544998605" autocomplete="tel" required></label>
        <button>Continue to Inttegro <span>→</span></button>
      </form>
    </section>
  </main>
</template>
