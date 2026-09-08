import asyncio
import os
from urllib.parse import urlencode
from uuid import uuid4

from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST
from inttegro import AsyncInttegroClient

from .service import DemoError, create_hosted_checkout, parse_checkout_input, validated_origin


# INTTEGRO:FLOW [checkout-presentation] POST /checkout creates one finalized
# Order for the hosted-page, embedded, and modal experiences described at
# https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
# INTTEGRO:VERIFY [server-side-verification] The /complete view is a UX return,
# not proof of payment. Resolve the order through a merchant-owned mapping and
# look it up server-side before fulfillment. Because merchant webhooks are not
# currently available, use bounded polling plus background reconciliation:
# https://studio.inttegro.com/webhooks


_inttegro_client: AsyncInttegroClient | None = None
_inttegro_client_lock: asyncio.Lock | None = None


def runtime_setting(request: HttpRequest, name: str) -> str:
    """Read a Worker binding first, then the ordinary process environment."""

    scope = getattr(request, "scope", {})
    worker_environment = scope.get("env") if isinstance(scope, dict) else None
    value = getattr(worker_environment, name, None) if worker_environment is not None else None
    return str(value).strip() if value is not None else os.environ.get(name, "").strip()


async def inttegro_client(request: HttpRequest) -> AsyncInttegroClient:
    global _inttegro_client, _inttegro_client_lock

    api_key = runtime_setting(request, "INTTEGRO_API_KEY")
    if not api_key:
        raise DemoError("configuration_error", "Set INTTEGRO_API_KEY on the server.")
    if _inttegro_client_lock is None:
        _inttegro_client_lock = asyncio.Lock()
    async with _inttegro_client_lock:
        if _inttegro_client is None or _inttegro_client.http.api_key != api_key:
            if _inttegro_client is not None:
                await _inttegro_client.aclose()
            _inttegro_client = AsyncInttegroClient(api_key=api_key)
        return _inttegro_client


@require_GET
async def home(request: HttpRequest) -> HttpResponse:
    return render(request, "checkout/home.html", {
        "attempt_id": uuid4().hex,
        "error_code": request.GET.get("code", ""),
        "error_message": request.GET.get("message", ""),
    })


@require_POST
async def checkout(request: HttpRequest) -> HttpResponse:
    wants_json = "application/json" in request.headers.get("Accept", "")
    try:
        values = parse_checkout_input(request.POST)
        default_origin = request.build_absolute_uri("/").rstrip("/")
        configured_origin = runtime_setting(request, "INTTEGRO_DEMO_PUBLIC_URL")
        origin = validated_origin(configured_origin or default_origin)
        client = await inttegro_client(request)
        order_id, checkout_url = await create_hosted_checkout(
            values,
            origin,
            client,
            runtime_setting(request, "INTTEGRO_DEMO_PRODUCT_ID"),
            runtime_setting(request, "INTTEGRO_DEMO_PRICE_ID"),
        )
        # INTTEGRO:DECISION [see-other-redirect] 303 tells the browser to follow
        # with GET. A 307/308 would preserve POST and risk sending this merchant
        # form body to the hosted checkout destination.
        response = (
            JsonResponse({"orderId": order_id}, status=201, headers={"Cache-Control": "no-store"})
            if wants_json
            else HttpResponse(status=303, headers={"Location": checkout_url})
        )
        # INTTEGRO:DECISION [durable-order-correlation] This short-lived HttpOnly
        # cookie is a demo aid, not authorization or payment evidence. Persist
        # merchant reservation, owner, Inttegro order ID, and idempotency key in
        # a durable production record.
        response.set_cookie("inttegro_demo_order", order_id, max_age=1800, httponly=True, samesite="Lax", secure=request.is_secure())
        return response
    except DemoError as error:
        # INTTEGRO:SECURITY [safe-error-boundary] Only our bounded error code and
        # message reach the browser. Detailed upstream diagnostics stay server-side.
        if wants_json:
            status = 400 if error.code == "validation_error" else 503
            return JsonResponse({"code": error.code, "message": error.message}, status=status, headers={"Cache-Control": "no-store"})
        return HttpResponse(status=303, headers={"Location": f"/?{urlencode({'code': error.code, 'message': error.message})}"})


@require_GET
async def complete(request: HttpRequest) -> HttpResponse:
    return render(request, "checkout/result.html", {"complete": True})


@require_GET
async def cancel(request: HttpRequest) -> HttpResponse:
    return render(request, "checkout/result.html", {"complete": False})


@require_GET
async def health(_request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok", "demo": "django"})
