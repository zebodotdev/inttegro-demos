from django.test import SimpleTestCase

from .service import CheckoutInput, DemoError, build_order_request, parse_checkout_input


class CheckoutServiceTests(SimpleTestCase):
    def test_rejects_invalid_email(self):
        with self.assertRaises(DemoError):
            parse_checkout_input({"name": "Akua", "email": "bad", "phone": "+233", "attempt_id": "attempt_123"})

    def test_builds_shared_order_request(self):
        request = build_order_request(CheckoutInput("Akua", "akua@example.com", "+233", "attempt_123"), "https://demo.example")
        self.assertEqual(request.request_meta.idempotency_key, "demo-attempt_123")
        self.assertTrue(request.finalize)
        self.assertEqual(request.checkout_settings.redirect_url, "https://demo.example/complete")
        self.assertEqual(request.line_items[0].product.price.value, 5000)
