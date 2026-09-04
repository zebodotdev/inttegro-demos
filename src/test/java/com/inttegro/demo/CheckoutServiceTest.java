package com.inttegro.demo;

import static org.assertj.core.api.Assertions.assertThat;

import com.inttegro.products.ProductType;
import org.junit.jupiter.api.Test;

class CheckoutServiceTest {
    @Test
    void buildsSharedOrderRequest() {
        var request = CheckoutService.buildOrderRequest(new CheckoutForm("Akua", "akua@example.com", "+233", "attempt_123"), "https://demo.example");
        assertThat(request.requestMeta.idempotencyKey).isEqualTo("demo-attempt_123");
        assertThat(request.finalize).isTrue();
        assertThat(request.checkoutSettings.redirectUrl).isEqualTo("https://demo.example/complete");
        assertThat(request.lineItems.get(0).product.name).isEqualTo("Invoice INV-2048");
        assertThat(request.lineItems.get(0).product.type).isEqualTo(ProductType.SERVICE);
        assertThat(request.lineItems.get(0).product.price.value).isEqualTo(5000);
    }
}
