import os
import re
from dataclasses import dataclass
from urllib.parse import urlparse

import inttegro
from inttegro import APIError, Currency, LineItemType, ProductType


# Inttegro integration map
#
# INTTEGRO:FLOW [hosted-checkout] This server-only module validates an untrusted
# reservation, creates and finalizes an Order, and returns the hosted invoice
# URL used by the Django view.
# INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY must stay in the trusted
# Django process. Never put it in a template, static asset, browser response, or
# settings value that a frontend build publishes.
# INTTEGRO:ALTERNATIVE [hosted-checkout] Direct API payment is available to apps
# prepared to own more payment state, recovery UI, method-specific behavior,
# testing, and compliance analysis.
# INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
# INTTEGRO:DOCS https://studio.inttegro.com/orders
# INTTEGRO:DOCS https://studio.inttegro.com/keys
# See ../../INTEGRATION_GUIDE.md and ../../integration-decisions.json for the complete
# rationale and machine-readable alternatives.


class DemoError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class CheckoutInput:
    name: str
    email: str
    phone: str
    attempt_id: str


def parse_checkout_input(values) -> CheckoutInput:
    checkout = CheckoutInput(
        name=str(values.get("name", "")).strip(),
        email=str(values.get("email", "")).strip(),
        phone=str(values.get("phone", "")).strip(),
        attempt_id=str(values.get("attempt_id", "")).strip(),
    )
    if not checkout.name or not checkout.phone or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", checkout.email):
        raise DemoError("validation_error", "Enter a name, valid email, and phone number.")
    if not re.fullmatch(r"[A-Za-z0-9_-]{8,100}", checkout.attempt_id):
        raise DemoError("validation_error", "Start a fresh checkout and try again.")
    return checkout


def validated_origin(value: str) -> str:
    # INTTEGRO:SECURITY [configured-public-origin] Prefer a configured,
    # allow-listed origin in production. A request-derived fallback is safe only
    # behind Django's precisely configured trusted proxy/host boundary. Return
    # URLs must be HTTP(S); Inttegro appends order_id after checkout.
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise DemoError("configuration_error", "The demo public URL is invalid.")
    return f"{parsed.scheme}://{parsed.netloc}"


def build_order_request(checkout: CheckoutInput, origin: str) -> inttegro.orders.CreateRequest:
    return inttegro.orders.CreateRequest(
        # INTTEGRO:DECISION [stable-idempotency-key] Reuse this key when retrying
        # the same logical reservation. In production, persist it with a durable
        # cart or booking; a new random key on retry can create a duplicate.
        # https://studio.inttegro.com/idempotency
        request_meta=inttegro.orders.RequestMeta(idempotency_key=f"demo-{checkout.attempt_id}"),
        # INTTEGRO:DECISION [inline-customer] Guest checkout uses customer_data.
        # Account-based flows should resolve customer_id on the server. The
        # Orders API accepts exactly one of the two customer representations.
        customer_data=inttegro.orders.Customer(name=checkout.name, email_address=checkout.email, phone_number=checkout.phone),
        # INTTEGRO:DECISION [finalize-on-create] The ticket and total are settled,
        # so one call freezes the order and produces invoice formats. If tax,
        # inventory, approval, or items can change, create a draft and finalize
        # it only after those values become authoritative.
        finalize=True,
        checkout_settings=inttegro.orders.CheckoutSettings(redirect_url=f"{origin}/complete", cancel_url=f"{origin}/cancel"),
        line_items=[inttegro.orders.ProductLineItem(
            type=LineItemType.PRODUCT,
            product=inttegro.orders.Product(
                # INTTEGRO:DECISION [inline-product] Inline product data keeps
                # this event demo independent of a catalog. Catalog users can
                # send product_id plus price or price_id, but must not mix the
                # catalog and inline shapes.
                type=ProductType.DIGITAL,
                name="Afterglow Sessions - Courtyard admission",
                quantity=1,
                # INTTEGRO:DECISION [minor-unit-money] Integer 5000 is GHS 50.00.
                # Use a currency-aware decimal/money type for variable amounts.
                price=inttegro.PriceParams(currency=Currency.GHS, value=5000),
            ),
        )],
    )


def create_hosted_checkout(checkout: CheckoutInput, origin: str) -> tuple[str, str]:
    # INTTEGRO:SECURITY [server-api-key] Use a deployment secret manager in
    # production and rotate the value there; do not serialize it into errors.
    api_key = os.environ.get("INTTEGRO_API_KEY", "").strip()
    if not api_key:
        raise DemoError("configuration_error", "Set INTTEGRO_API_KEY on the server.")
    try:
        # INTTEGRO:ALTERNATIVE [server-api-key] A long-running service can inject
        # one startup-configured client for connection reuse and application-
        # owned OpenTelemetry. Per-call construction keeps the demo local.
        # https://studio.inttegro.com/sdk-observability
        order = inttegro.InttegroClient(api_key=api_key).orders.create(build_order_request(checkout, origin))
        # INTTEGRO:DECISION [returned-checkout-url] Use the response's URL. Do
        # not construct one from order.id and undocumented routing conventions.
        checkout_url = order.invoice.format.web.url
        if not checkout_url:
            raise DemoError("api_error", "Inttegro did not return a hosted checkout URL.")
        return order.id, checkout_url
    except DemoError:
        raise
    except APIError as error:
        # INTTEGRO:SECURITY [safe-error-boundary] Keep upstream bodies,
        # credentials, and stack traces in protected server diagnostics. Public
        # messages remain stable and safe; log request IDs when available.
        raise DemoError("api_error", "Inttegro rejected the checkout request.") from error
    except Exception as error:
        raise DemoError("api_error", "Checkout is temporarily unavailable.") from error
