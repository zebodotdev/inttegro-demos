from django.test import SimpleTestCase
import inttegro
from inttegro import Currency, ProductType

from .service import CatalogSelection, CheckoutInput, DemoError, build_order_request, parse_checkout_input


class CheckoutServiceTests(SimpleTestCase):
    def test_rejects_invalid_email(self):
        with self.assertRaises(DemoError):
            parse_checkout_input({"name": "Akua", "email": "bad", "phone": "+233", "attempt_id": "attempt_123"})

    def test_builds_shared_order_request(self):
        product = CatalogSelection(
            type=ProductType.DIGITAL,
            name="Afterglow Sessions — Courtyard Admission",
            about="An evening of music and conversation.",
            reference="DEMO-AFTERGLOW-COURTYARD",
            price=inttegro.PriceParams(currency=Currency.GHS, value=5000),
        )
        request = build_order_request(
            CheckoutInput("Akua", "akua@example.com", "+233", "attempt_123"),
            "https://demo.example",
            product,
        )
        self.assertEqual(request.request_meta.idempotency_key, "demo-attempt_123")
        self.assertTrue(request.finalize)
        self.assertEqual(request.checkout_settings.redirect_url, "https://demo.example/complete")
        self.assertEqual(request.line_items[0].product.name, "Afterglow Sessions — Courtyard Admission")
        self.assertEqual(request.line_items[0].product.type.value, "digital")
        self.assertEqual(request.line_items[0].product.price.value, 5000)
