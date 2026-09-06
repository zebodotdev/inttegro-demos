from django.test import Client, SimpleTestCase, override_settings
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

    @override_settings(
        CSRF_TRUSTED_ORIGINS=["https://django-demo.inttegro.dev"],
        INTTEGRO_DEMO_PUBLIC_URL="https://django-demo.inttegro.dev",
        STORAGES={
            "staticfiles": {
                "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
            }
        },
    )
    def test_trusted_https_proxy_accepts_public_origin(self):
        client = Client(enforce_csrf_checks=True)
        page = client.get("/", HTTP_X_FORWARDED_PROTO="https")
        csrf_token = page.cookies["csrftoken"].value

        response = client.post(
            "/checkout",
            {
                "csrfmiddlewaretoken": csrf_token,
                "attempt_id": "attempt_123",
                "name": "Akua Mensah",
                "email": "invalid",
                "phone": "+233544998605",
            },
            HTTP_ORIGIN="https://django-demo.inttegro.dev",
            HTTP_X_FORWARDED_PROTO="https",
        )

        # Invalid input reaches the view and follows its bounded error redirect;
        # a proxy/CSRF regression would return 403 before the view runs.
        self.assertEqual(response.status_code, 303)
        self.assertIn("code=validation_error", response.headers["Location"])
