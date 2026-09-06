import os
from pathlib import Path
from urllib.parse import urlencode
from uuid import uuid4

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .checkout import DemoError, create_hosted_checkout, parse_checkout_input


# INTTEGRO:FLOW [hosted-checkout] POST /checkout is the transition from the
# Afterglow app to hosted Checkout documented at
# https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
# INTTEGRO:VERIFY [server-side-verification] A return to /complete is a browser
# signal, not payment evidence. Verify the order server-side and reconcile
# non-terminal states as described at https://studio.inttegro.com/webhooks.

ROOT = Path(__file__).resolve().parent
app = FastAPI(title="Inttegro FastAPI demo", docs_url="/api/docs")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")
templates = Jinja2Templates(directory=ROOT / "templates")


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {
        "attempt_id": uuid4().hex,
        "error_code": request.query_params.get("code", ""),
        "error_message": request.query_params.get("message", ""),
    })


@app.post("/checkout")
def checkout(request: Request, name: str = Form(), email: str = Form(), phone: str = Form(), attempt_id: str = Form()):
    try:
        value = parse_checkout_input(name, email, phone, attempt_id)
        origin = os.environ.get("INTTEGRO_DEMO_PUBLIC_URL", "").strip() or str(request.base_url).rstrip("/")
        order_id, checkout_url = create_hosted_checkout(value, origin)
        # INTTEGRO:DECISION [see-other-redirect] 303 follows the hosted URL with
        # GET. A 307/308 would preserve POST and could replay the merchant form.
        response = RedirectResponse(checkout_url, status_code=303)
        # INTTEGRO:DECISION [durable-order-correlation] This cookie is only a
        # server-readable demo correlation aid. It is neither authorization nor
        # proof of payment; persist an owner-scoped order mapping in production.
        response.set_cookie("inttegro_demo_order", order_id, max_age=1800, httponly=True, samesite="lax", secure=request.url.scheme == "https")
        return response
    except DemoError as error:
        # INTTEGRO:SECURITY [safe-error-boundary] Only bounded public messages go
        # to the browser; detailed SDK diagnostics remain in protected telemetry.
        return RedirectResponse(f"/?{urlencode({'code': error.code, 'message': error.message})}", status_code=303)


@app.get("/complete", response_class=HTMLResponse)
def complete(request: Request):
    return templates.TemplateResponse(request, "result.html", {"complete": True})


@app.get("/cancel", response_class=HTMLResponse)
def cancel(request: Request):
    return templates.TemplateResponse(request, "result.html", {"complete": False})


@app.get("/health", response_class=JSONResponse)
def health():
    return {"status": "ok", "demo": "fastapi"}
