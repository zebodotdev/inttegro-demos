import os
import re
from dataclasses import dataclass
from urllib.parse import urlparse

import inttegro
from inttegro import APIError, Currency, LineItemType, ProductType


# Inttegro integration map
#
# INTTEGRO:FLOW [hosted-checkout] This server-only module validates an untrusted
# ticket request, creates and finalizes an Order, and returns the hosted invoice
# URL used by the FastAPI route.
# INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY stays in the trusted Python
# process. Never publish it through frontend configuration, HTML, client code,
# mobile bundles, or error responses.
# INTTEGRO:ALTERNATIVE [hosted-checkout] Direct API payment offers additional UI
# control but makes the merchant own more payment states, recovery behavior,
# method-specific logic, testing, and compliance analysis.
# INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
# INTTEGRO:DOCS https://studio.inttegro.com/orders
# INTTEGRO:DOCS https://studio.inttegro.com/keys
# See ../../INTEGRATION_GUIDE.md and ../../integration-decisions.json for the full
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


def parse_checkout_input(name: str, email: str, phone: str, attempt_id: str) -> CheckoutInput:
    value = CheckoutInput(name.strip(), email.strip(), phone.strip(), attempt_id.strip())
    if not value.name or not value.phone or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value.email):
        raise DemoError("validation_error", "Enter a name, valid email, and phone number.")
    if not re.fullmatch(r"[A-Za-z0-9_-]{8,100}", value.attempt_id):
        raise DemoError("validation_error", "Start a fresh checkout and try again.")
    return value


def validated_origin(value: str) -> str:
    # INTTEGRO:SECURITY [configured-public-origin] Production should use an
    # allow-listed configured origin. A request-derived fallback is safe only
    # behind a precisely configured trusted proxy chain. Return URLs must be
    # absolute HTTP(S); Inttegro appends order_id after checkout.
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise DemoError("configuration_error", "The demo public URL is invalid.")
    return f"{parsed.scheme}://{parsed.netloc}"


def build_order_request(value: CheckoutInput, origin: str) -> inttegro.orders.CreateRequest:
    return inttegro.orders.CreateRequest(
        # INTTEGRO:DECISION [stable-idempotency-key] Reuse the key for retries of
        # this logical checkout. Production systems persist a cart- or booking-
        # derived key; creating a fresh key after a timeout permits duplicates.
        # https://studio.inttegro.com/idempotency
        request_meta=inttegro.orders.RequestMeta(idempotency_key=f"demo-{value.attempt_id}"),
        # INTTEGRO:DECISION [inline-customer] customer_data matches this guest
        # flow. Account-based products should resolve customer_id on the trusted
        # server. The Orders API accepts exactly one customer representation.
        customer_data=inttegro.orders.Customer(name=value.name, email_address=value.email, phone_number=value.phone),
        # INTTEGRO:DECISION [finalize-on-create] The item and total are settled,
        # so finalization freezes the order and generates invoice formats in one
        # call. Use draft -> update -> finalize for mutable tax, inventory,
        # approval, shipping, or line items.
        finalize=True,
        checkout_settings=inttegro.orders.CheckoutSettings(redirect_url=f"{origin}/complete", cancel_url=f"{origin}/cancel"),
        line_items=[inttegro.orders.ProductLineItem(
            type=LineItemType.PRODUCT,
            product=inttegro.orders.Product(
                # INTTEGRO:DECISION [inline-product] Inline data keeps this event
                # self-contained. Catalog users can send product_id with price or
                # price_id; do not mix catalog and inline product fields.
                type=ProductType.DIGITAL,
                name="Afterglow Sessions - Courtyard admission",
                quantity=1,
                # INTTEGRO:DECISION [minor-unit-money] 5000 minor units is
                # GHS 50.00. Convert variable input using decimal/money types.
                price=inttegro.PriceParams(currency=Currency.GHS, value=5000),
            ),
        )],
    )


def create_hosted_checkout(value: CheckoutInput, origin: str) -> tuple[str, str]:
    # INTTEGRO:SECURITY [server-api-key] Source this value from a managed runtime
    # secret in production; never include it in logs or client-visible errors.
    api_key = os.environ.get("INTTEGRO_API_KEY", "").strip()
    if not api_key:
        raise DemoError("configuration_error", "Set INTTEGRO_API_KEY on the server.")
    try:
        # INTTEGRO:ALTERNATIVE [server-api-key] Long-running apps can inject one
        # startup-configured client for connection reuse and application-owned
        # OpenTelemetry. The SDK chooses no exporter or vendor.
        # https://studio.inttegro.com/sdk-observability
        order = inttegro.InttegroClient(api_key=api_key).orders.create(build_order_request(value, validated_origin(origin)))
        # INTTEGRO:DECISION [returned-checkout-url] Use the response field rather
        # than constructing a URL from order.id and undocumented routing.
        checkout_url = order.invoice.format.web.url
        if not checkout_url:
            raise DemoError("api_error", "Inttegro did not return a hosted checkout URL.")
        return order.id, checkout_url
    except DemoError:
        raise
    except APIError as error:
        # INTTEGRO:SECURITY [safe-error-boundary] Keep raw upstream payloads,
        # credentials, and traces private. Log bounded metadata and request IDs;
        # expose only stable public categories.
        raise DemoError("api_error", "Inttegro rejected the checkout request.") from error
    except Exception as error:
        raise DemoError("api_error", "Checkout is temporarily unavailable.") from error
