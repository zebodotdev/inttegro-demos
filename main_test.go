package main

import (
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	inttegro "github.com/zebodotdev/inttegro-sdk-go/v4"
	"github.com/zebodotdev/inttegro-sdk-go/v4/money"
)

func TestParseCheckoutInputRejectsInvalidEmail(t *testing.T) {
	form := url.Values{"name": {"Akua"}, "email": {"bad"}, "phone": {"+233"}, "attempt_id": {"attempt_123"}}
	request := httptest.NewRequest("POST", "/checkout", strings.NewReader(form.Encode()))
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	if _, err := parseCheckoutInput(request); err == nil {
		t.Fatal("expected invalid input to fail")
	}
}

func TestBuildOrderRequest(t *testing.T) {
	product := catalogSelection{
		Type: inttegro.ProductTypeService, Name: "August Studio Retainer", About: "A focused month of product design.",
		Reference: "DEMO-LEDGERLINE-AUG-RETAINER",
		Price:     inttegro.PriceParams{AmountParams: money.AmountParams{Currency: money.GHS, Value: 5000}},
	}
	request := buildOrderRequest(checkoutInput{Name: "Akua", Email: "akua@example.com", Phone: "+233", AttemptID: "attempt_123"}, "https://demo.example", product)
	if request.RequestMeta.IdempotencyKey != "demo-attempt_123" {
		t.Fatalf("unexpected idempotency key: %s", request.RequestMeta.IdempotencyKey)
	}
	if request.Finalize == nil || !*request.Finalize {
		t.Fatal("order must be finalized")
	}
	if request.CheckoutSettings.RedirectURL != "https://demo.example/complete" {
		t.Fatalf("unexpected redirect URL: %s", request.CheckoutSettings.RedirectURL)
	}
	if got := request.LineItems[0].Product.Name; got != "August Studio Retainer" {
		t.Fatalf("unexpected product name: %s", got)
	}
	if got := request.LineItems[0].Product.Type; got != "service" {
		t.Fatalf("unexpected product type: %s", got)
	}
	if got := request.LineItems[0].Product.Price.Value; got != 5000 {
		t.Fatalf("unexpected amount: %d", got)
	}
}
