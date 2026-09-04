import pytest

from app.checkout import CheckoutInput, DemoError, build_order_request, parse_checkout_input


def test_rejects_invalid_email():
    with pytest.raises(DemoError):
        parse_checkout_input("Akua", "bad", "+233", "attempt_123")


def test_builds_shared_order_request():
    request = build_order_request(CheckoutInput("Akua", "akua@example.com", "+233", "attempt_123"), "https://demo.example")
    assert request.request_meta.idempotency_key == "demo-attempt_123"
    assert request.finalize is True
    assert request.checkout_settings.redirect_url == "https://demo.example/complete"
    assert request.line_items[0].product.name == "Afterglow Sessions - Courtyard admission"
    assert request.line_items[0].product.type.value == "digital"
    assert request.line_items[0].product.price.value == 5000
