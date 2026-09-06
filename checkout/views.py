from urllib.parse import urlencode
from uuid import uuid4

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST

from .service import DemoError, create_hosted_checkout, parse_checkout_input, validated_origin


# INTTEGRO:FLOW [hosted-checkout] POST /checkout performs the browser handoff
# described at https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
# INTTEGRO:VERIFY [server-side-verification] The /complete view is a UX return,
# not proof of payment. Resolve the order through a merchant-owned mapping and
# look it up server-side before fulfillment. Because merchant webhooks are not
# currently available, use bounded polling plus background reconciliation:
# https://studio.inttegro.com/webhooks


@require_GET
def home(request: HttpRequest) -> HttpResponse:
    return render(request, "checkout/home.html", {
        "attempt_id": uuid4().hex,
        "error_code": request.GET.get("code", ""),
        "error_message": request.GET.get("message", ""),
    })


@require_POST
def checkout(request: HttpRequest) -> HttpResponse:
    try:
        values = parse_checkout_input(request.POST)
        default_origin = request.build_absolute_uri("/").rstrip("/")
        origin = validated_origin(settings.INTTEGRO_DEMO_PUBLIC_URL or default_origin)
        order_id, checkout_url = create_hosted_checkout(values, origin)
        # INTTEGRO:DECISION [see-other-redirect] 303 tells the browser to follow
        # with GET. A 307/308 would preserve POST and risk sending this merchant
        # form body to the hosted checkout destination.
        response = HttpResponse(status=303, headers={"Location": checkout_url})
        # INTTEGRO:DECISION [durable-order-correlation] This short-lived HttpOnly
        # cookie is a demo aid, not authorization or payment evidence. Persist
        # merchant reservation, owner, Inttegro order ID, and idempotency key in
        # a durable production record.
        response.set_cookie("inttegro_demo_order", order_id, max_age=1800, httponly=True, samesite="Lax", secure=request.is_secure())
        return response
    except DemoError as error:
        # INTTEGRO:SECURITY [safe-error-boundary] Only our bounded error code and
        # message reach the browser. Detailed upstream diagnostics stay server-side.
        return HttpResponse(status=303, headers={"Location": f"/?{urlencode({'code': error.code, 'message': error.message})}"})


@require_GET
def complete(request: HttpRequest) -> HttpResponse:
    return render(request, "checkout/result.html", {"complete": True})


@require_GET
def cancel(request: HttpRequest) -> HttpResponse:
    return render(request, "checkout/result.html", {"complete": False})


@require_GET
def health(_request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok", "demo": "django"})
