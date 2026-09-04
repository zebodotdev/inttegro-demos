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
    ResponseEntity<Void> checkout(@Valid @ModelAttribute CheckoutForm form, BindingResult validation, HttpServletRequest request) {
        if (validation.hasErrors()) return errorRedirect("validation_error", "Enter a name, valid email, and phone number.");
        try {
            String origin = configuredOrigin.isEmpty() ? requestOrigin(request) : configuredOrigin;
            var result = checkoutService.create(form, origin);
            var cookie = ResponseCookie.from("inttegro_demo_order", result.orderId()).httpOnly(true).secure(request.isSecure()).sameSite("Lax").path("/").maxAge(1800).build();
            return ResponseEntity.status(HttpStatus.SEE_OTHER).location(URI.create(result.checkoutUrl())).header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
        } catch (DemoException error) {
            return errorRedirect(error.code(), error.getMessage());
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

    private static String requestOrigin(HttpServletRequest request) {
        int port = request.getServerPort();
        boolean defaultPort = (request.isSecure() && port == 443) || (!request.isSecure() && port == 80);
        return request.getScheme() + "://" + request.getServerName() + (defaultPort ? "" : ":" + port);
    }
}
