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
		RequestMeta:      &inttegro.RequestMeta{IdempotencyKey: "demo-" + input.AttemptID},
		CustomerData:     &inttegro.CustomerData{Name: input.Name, Email: input.Email, PhoneNumber: input.Phone},
		Finalize:         inttegro.Bool(true),
		CheckoutSettings: &inttegro.CheckoutSettings{RedirectURL: origin + "/complete", CancelURL: origin + "/cancel"},
		LineItems: []inttegro.OrderLineItemParams{{
			Type: inttegro.LineItemTypeProduct,
			Product: &inttegro.ProductLineItemParams{
				Type: inttegro.ProductTypeDigital, Name: "Inttegro integration workshop", Quantity: 1,
				Price: inttegro.PriceParams{AmountParams: money.AmountParams{Currency: money.GHS, Value: 5000}},
			},
		}},
	}
}

func createHostedCheckout(ctx context.Context, input checkoutInput, origin string) (string, string, error) {
	apiKey := strings.TrimSpace(os.Getenv("INTTEGRO_API_KEY"))
	if apiKey == "" {
		return "", "", &demoError{Code: "configuration_error", Message: "Set INTTEGRO_API_KEY on the server."}
	}
	order, err := inttegro.NewClient(apiKey).Orders.Create(ctx, buildOrderRequest(input, origin))
	if err != nil {
		var apiError *inttegro.APIError
		if errors.As(err, &apiError) {
			return "", "", &demoError{Code: "api_error", Message: "Inttegro rejected the checkout request."}
		}
		return "", "", &demoError{Code: "api_error", Message: "Checkout is temporarily unavailable."}
	}
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
				http.SetCookie(response, &http.Cookie{Name: "inttegro_demo_order", Value: orderID, Path: "/", MaxAge: 1800, HttpOnly: true, SameSite: http.SameSiteLaxMode, Secure: request.TLS != nil})
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
	query := url.Values{"code": {safe.Code}, "message": {safe.Message}}
	http.Redirect(response, request, "/?"+query.Encode(), http.StatusSeeOther)
}

func main() {
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
