package com.inttegro.demo;

import com.inttegro.ApiException;
import com.inttegro.Client;
import com.inttegro.RequestMeta;
import com.inttegro.customers.CustomerData;
import com.inttegro.money.Currency;
import com.inttegro.orders.CheckoutSettings;
import com.inttegro.orders.Order;
import com.inttegro.orders.OrderCreateParams;
import com.inttegro.orders.OrderLineItemParams;
import com.inttegro.prices.PriceParams;
import com.inttegro.products.ProductType;
import java.net.URI;

import org.springframework.stereotype.Service;

@Service
public class CheckoutService {
    public record CheckoutResult(String orderId, String checkoutUrl) {}

    public static final class DemoException extends RuntimeException {
        private final String code;

        DemoException(String code, String message) {
            super(message);
            this.code = code;
        }

        public String code() { return code; }
    }

    static OrderCreateParams buildOrderRequest(CheckoutForm form, String origin) {
        return OrderCreateParams.builder()
                .requestMeta(RequestMeta.withIdempotencyKey("demo-" + form.attemptId()))
                .customerData(CustomerData.builder().name(form.name().trim()).email(form.email().trim()).phoneNumber(form.phone().trim()).build())
                .finalizeOrder(true)
                .checkoutSettings(CheckoutSettings.builder().redirectUrl(origin + "/complete").cancelUrl(origin + "/cancel").build())
                .lineItem(OrderLineItemParams.product(product -> product
                        .type(ProductType.DIGITAL)
                        .name("Inttegro integration workshop")
                        .quantity(1)
                        .price(PriceParams.of(Currency.GHS, 5000))))
                .build();
    }

    CheckoutResult create(CheckoutForm form, String origin) {
        String apiKey = System.getenv().getOrDefault("INTTEGRO_API_KEY", "").trim();
        if (apiKey.isEmpty()) {
            throw new DemoException("configuration_error", "Set INTTEGRO_API_KEY on the server.");
        }
        String publicOrigin = validatedOrigin(origin);
        try {
            Order order = new Client(apiKey).orders().create(buildOrderRequest(form, publicOrigin));
            if (order.invoice == null || order.invoice.format == null || order.invoice.format.web == null || order.invoice.format.web.url == null) {
                throw new DemoException("api_error", "Inttegro did not return a hosted checkout URL.");
            }
            return new CheckoutResult(order.id, order.invoice.format.web.url);
        } catch (DemoException error) {
            throw error;
        } catch (ApiException error) {
            throw new DemoException("api_error", "Inttegro rejected the checkout request.");
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new DemoException("api_error", "Checkout was interrupted. Try again.");
        } catch (Exception error) {
            throw new DemoException("api_error", "Checkout is temporarily unavailable.");
        }
    }

    private static String validatedOrigin(String value) {
        try {
            URI uri = URI.create(value);
            if (!("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) || uri.getHost() == null) throw new IllegalArgumentException();
            return uri.getScheme() + "://" + uri.getAuthority();
        } catch (IllegalArgumentException error) {
            throw new DemoException("configuration_error", "The demo public URL is invalid.");
        }
    }
}
