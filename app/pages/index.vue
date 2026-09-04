<script setup lang="ts">
const route = useRoute();
const attemptId = useState('attempt-id', () => crypto.randomUUID());
const errorCode = computed(() => typeof route.query.code === 'string' ? route.query.code : '');
const errorMessage = computed(() => typeof route.query.message === 'string' ? route.query.message : '');
useSeoMeta({ title: 'Kora Market — Inttegro + Nuxt', description: 'A production-shaped storefront powered by Nuxt and Inttegro.' });
</script>

<template>
  <div class="story-kora">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="Kora Market home"><span class="brand-mark">K</span>Kora Market</a>
      <nav class="header-nav" aria-label="Store navigation"><a href="#collection" aria-current="page">Collection</a><a href="#story">Our story</a><button class="header-action" type="button" data-cart-open>Bag · 1</button></nav>
    </header>
    <main id="top" class="kora-main">
      <section class="kora-hero" aria-labelledby="product-title">
        <div class="kora-copy">
          <p class="eyebrow">New from the Volta studio</p><h1 id="product-title">A slower, warmer morning.</h1>
          <p class="lede">The Dawn Brew Set is shaped and fired in small batches, pairing a sculptural pour-over with a cup designed to make the first ritual of the day feel considered.</p>
          <div class="kora-actions"><button class="primary-action" type="button" data-cart-open>Add to bag · GHS 50</button><a class="secondary-action" href="#story">Meet the maker</a></div>
          <div class="kora-proof"><div class="avatar-stack" aria-hidden="true"><span>AM</span><span>KO</span><span>YA</span></div><span>Loved by 240 thoughtful homes · 4.9 ★</span></div>
        </div>
        <div id="collection" class="product-stage">
          <div class="product-image-wrap"><img src="/kora-dawn-brew.jpg" alt="Terracotta pour-over coffee set with a small cup and natural linen"></div>
          <div class="product-badge"><span class="status-dot" /> Ready to ship</div>
          <aside class="product-float" aria-label="Product summary"><div class="row"><span class="rating">★★★★★</span><strong class="price">GHS 50</strong></div><h2>Dawn Brew Set</h2><p class="microcopy">Hand-thrown stoneware · <span data-finish-label>Sunrise clay</span></p><div class="swatches" aria-label="Choose finish"><button class="swatch" type="button" aria-label="Sunrise clay" aria-pressed="true" data-swatch /><button class="swatch" type="button" aria-label="Night earth" aria-pressed="false" data-swatch /><button class="swatch" type="button" aria-label="River sand" aria-pressed="false" data-swatch /></div></aside>
        </div>
      </section>
      <section id="story" class="story-section" aria-labelledby="story-title">
        <div class="story-section-head"><div><p class="eyebrow">Made with intention</p><h2 id="story-title">From earth to everyday ritual.</h2></div><p class="microcopy">Designed by Ama Ofori · Ho, Ghana</p></div>
        <div class="story-grid"><article class="story-card"><span class="number">01 / FORM</span><h3>Thrown by hand, never rushed.</h3><p>Every silhouette keeps the small variations that make an object personal. No two sets land in quite the same way.</p></article><article class="story-card"><span class="number">02 / MATERIAL</span><h3>Local clay</h3><p>A durable, food-safe finish with a naturally warm touch.</p></article><article class="story-card"><span class="number">03 / DELIVERY</span><h3>Carefully packed</h3><p>Plastic-free materials and delivery across Ghana in 2–4 days.</p></article></div>
      </section>
    </main>
    <dialog class="cart-dialog" data-cart-dialog :data-auto-open="errorCode ? '' : undefined">
      <div class="cart-head"><h2>Your bag</h2><button class="icon-button" type="button" aria-label="Close bag" data-cart-close /></div>
      <div class="cart-body">
        <p v-if="errorCode" class="inline-error" role="alert"><strong>{{ errorCode.replaceAll('_', ' ') }}:</strong> {{ errorMessage || 'Checkout could not be started.' }}</p>
        <div class="cart-line"><img src="/kora-dawn-brew.jpg" alt=""><div><div class="row"><h3>Dawn Brew Set</h3><strong>GHS 50</strong></div><p class="microcopy"><span data-finish-label>Sunrise clay</span> · Quantity 1</p></div></div><div class="cart-total"><span>Total</span><strong>GHS 50.00</strong></div>
        <form class="checkout-form" action="/checkout" method="post" data-checkout-form><input type="hidden" name="attempt_id" :value="attemptId"><div class="field-grid"><label>Full name<input name="name" value="Akua Mensah" autocomplete="name" required></label><label>Email address<input name="email" type="email" value="akua@example.com" autocomplete="email" required></label></div><label>Phone number<input name="phone" type="tel" value="+233544998605" autocomplete="tel" required></label><button class="checkout-button" type="submit">Continue securely <span>→</span></button><p class="secure-note">Secure checkout powered by Inttegro · API key remains server-side</p></form>
      </div>
    </dialog>
  </div>
</template>
