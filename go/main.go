package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	inttegro "github.com/zebodotdev/inttegro-sdk-go/v4"
	"github.com/zebodotdev/inttegro-sdk-go/v4/money"
)

// Inttegro integration map
//
// INTTEGRO:FLOW [hosted-checkout] This trusted server validates an invoice
// payment, creates and finalizes an Order, and redirects to its hosted invoice
// URL.
// INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY stays in this server
// process. Never emit it into HTML, client JavaScript, logs, or error responses.
// INTTEGRO:ALTERNATIVE [hosted-checkout] Direct API payment is available to
// products prepared to own more payment state, recovery UI, method-specific
// behavior, testing, and compliance analysis.
// INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
// INTTEGRO:DOCS https://studio.inttegro.com/orders
// INTTEGRO:DOCS https://studio.inttegro.com/keys
// See ../INTEGRATION_GUIDE.md and ../integration-decisions.json for the shared
// rationale and machine-readable alternatives.

type demoError struct {
	Code    string
	Message string
}

func (e *demoError) Error() string { return e.Message }

type checkoutInput struct {
	Name      string
	Email     string
	Phone     string
	AttemptID string
}

type pageData struct {
	AttemptID    string
	ErrorCode    string
	ErrorMessage string
}

var (
	emailPattern   = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	attemptPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{8,100}$`)
	templates      = template.Must(template.ParseGlob("templates/*.html"))
)

func parseCheckoutInput(request *http.Request) (checkoutInput, error) {
	if err := request.ParseForm(); err != nil {
		return checkoutInput{}, &demoError{Code: "validation_error", Message: "The submitted form is invalid."}
	}
	input := checkoutInput{
		Name: strings.TrimSpace(request.FormValue("name")), Email: strings.TrimSpace(request.FormValue("email")),
		Phone: strings.TrimSpace(request.FormValue("phone")), AttemptID: strings.TrimSpace(request.FormValue("attempt_id")),
	}
	if input.Name == "" || input.Phone == "" || !emailPattern.MatchString(input.Email) {
		return checkoutInput{}, &demoError{Code: "validation_error", Message: "Enter a name, valid email, and phone number."}
	}
	if !attemptPattern.MatchString(input.AttemptID) {
		return checkoutInput{}, &demoError{Code: "validation_error", Message: "Start a fresh checkout and try again."}
	}
	return input, nil
}

func publicOrigin(request *http.Request) (string, error) {
	// INTTEGRO:SECURITY [configured-public-origin] Prefer an allow-listed
	// configured origin in production. A request-derived fallback is safe only
	// behind a precisely configured trusted proxy chain. Return URLs must be
	// HTTP(S); Inttegro appends order_id after checkout.
	value := strings.TrimSpace(os.Getenv("INTTEGRO_DEMO_PUBLIC_URL"))
	if value == "" {
		scheme := "http"
		if request.TLS != nil {
			scheme = "https"
		}
		value = scheme + "://" + request.Host
	}
	parsed, err := url.ParseRequestURI(value)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", &demoError{Code: "configuration_error", Message: "The demo public URL is invalid."}
	}
	return parsed.Scheme + "://" + parsed.Host, nil
}

func buildOrderRequest(input checkoutInput, origin string) inttegro.OrderCreateParams {
	return inttegro.OrderCreateParams{
		// INTTEGRO:DECISION [stable-idempotency-key] Reuse this key for retries of
		// one logical invoice payment. Production systems should persist a key
		// derived from the merchant invoice; a fresh retry key permits duplicates.
		// https://studio.inttegro.com/idempotency
		RequestMeta: &inttegro.RequestMeta{IdempotencyKey: "demo-" + input.AttemptID},
		// INTTEGRO:DECISION [inline-customer] customer_data fits this guest flow.
		// Account-based apps should resolve customer_id on the server; Inttegro
		// accepts exactly one of the two customer representations.
		CustomerData: &inttegro.CustomerData{Name: input.Name, Email: input.Email, PhoneNumber: input.Phone},
		// INTTEGRO:DECISION [finalize-on-create] This invoice is already settled,
		// so finalization freezes it and creates checkout formats in one operation.
		// Use draft -> update -> finalize for mutable lines, tax, or approval.
		Finalize:         inttegro.Bool(true),
		CheckoutSettings: &inttegro.CheckoutSettings{RedirectURL: origin + "/complete", CancelURL: origin + "/cancel"},
		LineItems: []inttegro.OrderLineItemParams{{
			Type: inttegro.LineItemTypeProduct,
			Product: &inttegro.ProductLineItemParams{
				// INTTEGRO:DECISION [inline-product] Inline data keeps the service
				// invoice self-contained. Catalog users can send product_id with an
				// explicit price or price_id; do not mix both request shapes.
				Type: inttegro.ProductTypeService, Name: "Invoice INV-2048", Quantity: 1,
				// INTTEGRO:DECISION [minor-unit-money] 5000 minor units means
				// GHS 50.00. Use a currency-aware decimal/money type for conversion.
				Price: inttegro.PriceParams{AmountParams: money.AmountParams{Currency: money.GHS, Value: 5000}},
			},
		}},
	}
}

func createHostedCheckout(ctx context.Context, input checkoutInput, origin string) (string, string, error) {
	// INTTEGRO:SECURITY [server-api-key] Source this from a deployment secret
	// manager and rotate it there; never serialize it into a public response.
	apiKey := strings.TrimSpace(os.Getenv("INTTEGRO_API_KEY"))
	if apiKey == "" {
		return "", "", &demoError{Code: "configuration_error", Message: "Set INTTEGRO_API_KEY on the server."}
	}
	// INTTEGRO:ALTERNATIVE [server-api-key] A production service can inject one
	// startup-configured client for transport reuse and application-owned
	// OpenTelemetry. The SDK chooses no exporter or vendor.
	// https://studio.inttegro.com/sdk-observability
	order, err := inttegro.NewClient(apiKey).Orders.Create(ctx, buildOrderRequest(input, origin))
	if err != nil {
		// INTTEGRO:SECURITY [safe-error-boundary] Keep raw upstream payloads,
		// credentials, and traces private. Public messages stay stable; record
		// only bounded metadata and request IDs in protected telemetry.
		var apiError *inttegro.APIError
		if errors.As(err, &apiError) {
			return "", "", &demoError{Code: "api_error", Message: "Inttegro rejected the checkout request."}
		}
		return "", "", &demoError{Code: "api_error", Message: "Checkout is temporarily unavailable."}
	}
	// INTTEGRO:DECISION [returned-checkout-url] Use the URL in the response;
	// constructing one from order.ID depends on undocumented routing details.
	if order.Invoice == nil || order.Invoice.Format == nil || order.Invoice.Format.Web == nil || order.Invoice.Format.Web.URL == "" {
		return "", "", &demoError{Code: "api_error", Message: "Inttegro did not return a hosted checkout URL."}
	}
	return order.ID, order.Invoice.Format.Web.URL, nil
}

func newAttemptID() string {
	value := make([]byte, 16)
	if _, err := rand.Read(value); err != nil {
		return fmt.Sprintf("attempt_%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(value)
}

func render(response http.ResponseWriter, name string, data any) {
	response.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := templates.ExecuteTemplate(response, name, data); err != nil {
		http.Error(response, "Page unavailable", http.StatusInternalServerError)
	}
}

func home(response http.ResponseWriter, request *http.Request) {
	if request.URL.Path != "/" {
		http.NotFound(response, request)
		return
	}
	render(response, "home.html", pageData{AttemptID: newAttemptID(), ErrorCode: request.URL.Query().Get("code"), ErrorMessage: request.URL.Query().Get("message")})
}

func checkout(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		response.Header().Set("Allow", http.MethodPost)
		http.Error(response, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	input, err := parseCheckoutInput(request)
	if err == nil {
		var origin string
		origin, err = publicOrigin(request)
		if err == nil {
			var orderID, checkoutURL string
			orderID, checkoutURL, err = createHostedCheckout(request.Context(), input, origin)
			if err == nil {
				// INTTEGRO:DECISION [durable-order-correlation] This short-lived
				// HttpOnly cookie is only a demo aid. Production code persists an
				// owner-scoped merchant invoice -> Inttegro order mapping.
				http.SetCookie(response, &http.Cookie{Name: "inttegro_demo_order", Value: orderID, Path: "/", MaxAge: 1800, HttpOnly: true, SameSite: http.SameSiteLaxMode, Secure: request.TLS != nil})
				// INTTEGRO:DECISION [see-other-redirect] 303 follows the hosted
				// URL with GET. A 307/308 would preserve and replay this POST.
				http.Redirect(response, request, checkoutURL, http.StatusSeeOther)
				return
			}
		}
	}
	safe := &demoError{Code: "api_error", Message: "Checkout is temporarily unavailable."}
	var mapped *demoError
	if errors.As(err, &mapped) {
		safe = mapped
	}
	// INTTEGRO:SECURITY [safe-error-boundary] Only our bounded error vocabulary
	// enters the query string; detailed API diagnostics remain server-side.
	query := url.Values{"code": {safe.Code}, "message": {safe.Message}}
	http.Redirect(response, request, "/?"+query.Encode(), http.StatusSeeOther)
}

func main() {
	// INTTEGRO:VERIFY [server-side-verification] /complete is a UX return, not
	// proof of payment. Resolve and look up the owner-scoped order before
	// fulfillment. Merchant webhooks are not currently available, so use bounded
	// polling plus a background reconciliation job:
	// https://studio.inttegro.com/webhooks
	mux := http.NewServeMux()
	mux.HandleFunc("/", home)
	mux.HandleFunc("/checkout", checkout)
	mux.HandleFunc("/complete", func(w http.ResponseWriter, _ *http.Request) {
		render(w, "result.html", map[string]any{"Complete": true})
	})
	mux.HandleFunc("/cancel", func(w http.ResponseWriter, _ *http.Request) {
		render(w, "result.html", map[string]any{"Complete": false})
	})
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok","demo":"go"}`)
	})
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	port := os.Getenv("PORT")
	if port == "" {
		port = "3003"
	}
	server := &http.Server{Addr: ":" + port, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	log.Printf("Inttegro Go demo listening on http://localhost:%s", port)
	log.Fatal(server.ListenAndServe())
}
