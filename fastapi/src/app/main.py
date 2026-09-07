import os
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncIterator
from urllib.parse import urlencode
from uuid import uuid4

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from inttegro import AsyncInttegroClient

from .checkout import DemoError, create_hosted_checkout, parse_checkout_input


# INTTEGRO:FLOW [hosted-checkout] POST /checkout is the transition from the
# Afterglow app to hosted Checkout documented at
# https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
# INTTEGRO:VERIFY [server-side-verification] A return to /complete is a browser
# signal, not payment evidence. Verify the order server-side and reconcile
# non-terminal states as described at https://studio.inttegro.com/webhooks.

ROOT = Path(__file__).resolve().parent
STATIC_ROOT = ROOT.parent / "public" / "static"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield
    client = getattr(app.state, "inttegro_client", None)
    if client is not None:
        await client.aclose()


app = FastAPI(title="Inttegro FastAPI demo", docs_url="/api/docs", lifespan=lifespan)
if STATIC_ROOT.is_dir():
    # Containers serve this directory through Starlette. Cloudflare Static
    # Assets are intentionally absent from the Worker filesystem and intercept
    # /static/* before the ASGI application runs.
    app.mount("/static", StaticFiles(directory=STATIC_ROOT), name="static")
templates = Jinja2Templates(directory=ROOT / "templates")


def runtime_setting(request: Request, name: str) -> str:
    """Read a Worker binding first, then the ordinary process environment."""

    worker_environment: Any = request.scope.get("env")
    value = getattr(worker_environment, name, None) if worker_environment is not None else None
    return str(value).strip() if value is not None else os.environ.get(name, "").strip()


async def inttegro_client(request: Request) -> AsyncInttegroClient:
    api_key = runtime_setting(request, "INTTEGRO_API_KEY")
    if not api_key:
        raise DemoError("configuration_error", "Set INTTEGRO_API_KEY on the server.")

    # INTTEGRO:DECISION [connection-pooling] Reuse one client per process or
    # Worker isolate. The lock avoids constructing duplicate pools when the
    # first requests arrive concurrently. A secret rotation creates a new pool
    # and closes the old one without ever persisting or logging the key.
    lock = getattr(request.app.state, "inttegro_client_lock", None)
    if lock is None:
        lock = asyncio.Lock()
        request.app.state.inttegro_client_lock = lock
    async with lock:
        client = getattr(request.app.state, "inttegro_client", None)
        if client is None or client.http.api_key != api_key:
            if client is not None:
                await client.aclose()
            client = AsyncInttegroClient(api_key=api_key)
            request.app.state.inttegro_client = client
        return client


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {
        "attempt_id": uuid4().hex,
        "error_code": request.query_params.get("code", ""),
        "error_message": request.query_params.get("message", ""),
    })


@app.post("/checkout")
async def checkout(request: Request, name: str = Form(), email: str = Form(), phone: str = Form(), attempt_id: str = Form()):
    try:
        value = parse_checkout_input(name, email, phone, attempt_id)
        origin = os.environ.get("INTTEGRO_DEMO_PUBLIC_URL", "").strip() or str(request.base_url).rstrip("/")
        client = await inttegro_client(request)
        order_id, checkout_url = await create_hosted_checkout(
            value,
            origin,
            client,
            runtime_setting(request, "INTTEGRO_DEMO_PRODUCT_ID"),
            runtime_setting(request, "INTTEGRO_DEMO_PRICE_ID"),
        )
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
async def complete(request: Request):
    return templates.TemplateResponse(request, "result.html", {"complete": True})


@app.get("/cancel", response_class=HTMLResponse)
async def cancel(request: Request):
    return templates.TemplateResponse(request, "result.html", {"complete": False})


@app.get("/health", response_class=JSONResponse)
async def health():
    return {"status": "ok", "demo": "fastapi"}
