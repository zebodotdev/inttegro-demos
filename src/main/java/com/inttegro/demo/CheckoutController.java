package com.inttegro.demo;

import com.inttegro.demo.CheckoutService.DemoException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.util.UriComponentsBuilder;

@Controller
public class CheckoutController {
    /*
     * INTTEGRO:FLOW [checkout-presentation] POST /checkout builds one finalized
     * Order for hosted-page, embedded, and modal Checkout described at
     * https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
     * INTTEGRO:VERIFY [server-side-verification] /complete is a UX return, not
     * payment proof. Resolve and look up the owner-scoped order before
     * fulfillment; current reconciliation guidance is
     * https://studio.inttegro.com/webhooks.
     */
    private final CheckoutService checkoutService;
    private final String configuredOrigin;

    CheckoutController(CheckoutService checkoutService, @Value("${inttegro.demo-public-url:}") String configuredOrigin) {
        this.checkoutService = checkoutService;
        this.configuredOrigin = configuredOrigin.trim();
    }

    @GetMapping("/")
    String home(@RequestParam(defaultValue = "") String code, @RequestParam(defaultValue = "") String message, Model model) {
        model.addAttribute("attemptId", UUID.randomUUID().toString());
        model.addAttribute("errorCode", code);
        model.addAttribute("errorMessage", message);
        return "checkout";
    }

    @PostMapping("/checkout")
    ResponseEntity<?> checkout(@Valid @ModelAttribute CheckoutForm form, BindingResult validation, HttpServletRequest request) {
        boolean wantsJson = acceptsJson(request);
        if (validation.hasErrors()) return errorResponse(wantsJson, "validation_error", "Enter a name, valid email, and phone number.");
        try {
            String origin = configuredOrigin.isEmpty() ? requestOrigin(request) : configuredOrigin;
            var result = checkoutService.create(form, origin);
            // INTTEGRO:DECISION [durable-order-correlation] This HttpOnly cookie
            // is only an illustrative correlation aid. Production systems
            // persist merchant invoice, owner, Inttegro order ID, and
            // idempotency key in a durable mapping.
            var cookie = ResponseCookie.from("inttegro_demo_order", result.orderId()).httpOnly(true).secure(request.isSecure()).sameSite("Lax").path("/").maxAge(1800).build();
            if (wantsJson) {
                return ResponseEntity.status(HttpStatus.CREATED)
                        .header(HttpHeaders.SET_COOKIE, cookie.toString())
                        .header(HttpHeaders.CACHE_CONTROL, "no-store")
                        .body(Map.of("orderId", result.orderId()));
            }
            // INTTEGRO:DECISION [see-other-redirect] HTTP 303 follows with GET;
            // unlike 307/308, it cannot replay this merchant POST body.
            return ResponseEntity.status(HttpStatus.SEE_OTHER).location(URI.create(result.checkoutUrl())).header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
        } catch (DemoException error) {
            // INTTEGRO:SECURITY [safe-error-boundary] Only bounded public errors
            // reach the redirect. Detailed SDK diagnostics remain server-side.
            return errorResponse(wantsJson, error.code(), error.getMessage());
        }
    }

    @GetMapping("/complete")
    String complete(Model model) { model.addAttribute("complete", true); return "result"; }

    @GetMapping("/cancel")
    String cancel(Model model) { model.addAttribute("complete", false); return "result"; }

    @GetMapping("/health")
    @ResponseBody
    Map<String, String> health() { return Map.of("status", "ok", "demo", "spring-boot"); }

    private static ResponseEntity<Void> errorRedirect(String code, String message) {
        String location = UriComponentsBuilder.fromPath("/").queryParam("code", code).queryParam("message", message).build().encode().toUriString();
        return ResponseEntity.status(HttpStatus.SEE_OTHER).location(URI.create(location)).build();
    }

    private static ResponseEntity<?> errorResponse(boolean wantsJson, String code, String message) {
        if (!wantsJson) return errorRedirect(code, message);
        HttpStatus status = "validation_error".equals(code) ? HttpStatus.BAD_REQUEST : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(Map.of("code", code, "message", message));
    }

    private static boolean acceptsJson(HttpServletRequest request) {
        String accept = request.getHeader(HttpHeaders.ACCEPT);
        return accept != null && accept.contains("application/json");
    }

    private static String requestOrigin(HttpServletRequest request) {
        int port = request.getServerPort();
        boolean defaultPort = (request.isSecure() && port == 443) || (!request.isSecure() && port == 80);
        return request.getScheme() + "://" + request.getServerName() + (defaultPort ? "" : ":" + port);
    }
}
