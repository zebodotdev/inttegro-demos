import os
import re
from dataclasses import dataclass
from urllib.parse import urlparse

import inttegro
from inttegro import APIError, Currency, LineItemType, ProductType


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
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise DemoError("configuration_error", "The demo public URL is invalid.")
    return f"{parsed.scheme}://{parsed.netloc}"


def build_order_request(checkout: CheckoutInput, origin: str) -> inttegro.orders.CreateRequest:
    return inttegro.orders.CreateRequest(
        request_meta=inttegro.orders.RequestMeta(idempotency_key=f"demo-{checkout.attempt_id}"),
        customer_data=inttegro.orders.Customer(name=checkout.name, email_address=checkout.email, phone_number=checkout.phone),
        finalize=True,
        checkout_settings=inttegro.orders.CheckoutSettings(redirect_url=f"{origin}/complete", cancel_url=f"{origin}/cancel"),
        line_items=[inttegro.orders.ProductLineItem(
            type=LineItemType.PRODUCT,
            product=inttegro.orders.Product(
                type=ProductType.DIGITAL,
                name="Afterglow Sessions - Courtyard admission",
                quantity=1,
                price=inttegro.PriceParams(currency=Currency.GHS, value=5000),
            ),
        )],
    )


def create_hosted_checkout(checkout: CheckoutInput, origin: str) -> tuple[str, str]:
    api_key = os.environ.get("INTTEGRO_API_KEY", "").strip()
    if not api_key:
        raise DemoError("configuration_error", "Set INTTEGRO_API_KEY on the server.")
    try:
        order = inttegro.InttegroClient(api_key=api_key).orders.create(build_order_request(checkout, origin))
        checkout_url = order.invoice.format.web.url
        if not checkout_url:
            raise DemoError("api_error", "Inttegro did not return a hosted checkout URL.")
        return order.id, checkout_url
    except DemoError:
        raise
    except APIError as error:
        raise DemoError("api_error", "Inttegro rejected the checkout request.") from error
    except Exception as error:
        raise DemoError("api_error", "Checkout is temporarily unavailable.") from error
