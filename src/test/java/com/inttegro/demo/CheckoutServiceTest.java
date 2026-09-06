package com.inttegro.demo;

import static org.assertj.core.api.Assertions.assertThat;

import com.inttegro.money.Currency;
import com.inttegro.prices.PriceParams;
import com.inttegro.products.ProductType;
import org.junit.jupiter.api.Test;

class CheckoutServiceTest {
    @Test
    void buildsSharedOrderRequest() {
        var product = new CheckoutService.CatalogSelection(
                ProductType.SERVICE,
                "August Studio Retainer",
                "A focused month of product design.",
                "DEMO-LEDGERLINE-AUG-RETAINER",
                PriceParams.of(Currency.GHS, 5000));
        var request = CheckoutService.buildOrderRequest(
                new CheckoutForm("Akua", "akua@example.com", "+233", "attempt_123"),
                "https://demo.example",
                product);
        assertThat(request.requestMeta.idempotencyKey).isEqualTo("demo-attempt_123");
        assertThat(request.finalize).isTrue();
        assertThat(request.checkoutSettings.redirectUrl).isEqualTo("https://demo.example/complete");
        assertThat(request.lineItems.get(0).product.name).isEqualTo("August Studio Retainer");
        assertThat(request.lineItems.get(0).product.type).isEqualTo(ProductType.SERVICE);
        assertThat(request.lineItems.get(0).product.price.value).isEqualTo(5000);
    }
}
