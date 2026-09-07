"""Cloudflare Workers entry point for the Django ASGI application."""

import os
from typing import Any

from workers import WorkerEntrypoint, asgi


def _binding(env, name: str, default: str = "") -> str:
    value = getattr(env, name, None)
    return str(value).strip() if value is not None else default


_application: Any | None = None


def _load_application(env) -> Any:
    """Configure Django from bindings before constructing its middleware."""

    global _application
    if _application is not None:
        return _application

    secret_key = _binding(env, "DJANGO_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("DJANGO_SECRET_KEY is required")

    # Django reads these values while importing settings. Loading the ASGI app
    # before applying them would leave security-sensitive development defaults
    # in place for the lifetime of the Worker isolate.
    os.environ["DJANGO_SECRET_KEY"] = secret_key
    os.environ["DJANGO_ALLOWED_HOSTS"] = _binding(
        env, "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver"
    )
    os.environ["DJANGO_CSRF_TRUSTED_ORIGINS"] = _binding(
        env, "DJANGO_CSRF_TRUSTED_ORIGINS"
    )
    os.environ["INTTEGRO_DEMO_CLOUDFLARE"] = "true"

    # Python Workers have no OS threads. This demo contains no blocking sync
    # work, so its documented compatibility shim keeps Django's small sync
    # framework hooks on the event loop before Django imports the adapter.
    from worker_compat import install_django_asgi_worker_compatibility

    install_django_asgi_worker_compatibility()
    from inttegro_demo.asgi import application

    _application = application
    return _application


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        # INTTEGRO:SECURITY [worker-bindings] Django reads host, CSRF, and
        # signing settings before routing. Apply Cloudflare's non-process
        # bindings at the adapter boundary; no secret enters the ASGI scope,
        # response, static assets, or repository configuration.
        # INTTEGRO:DOCS https://studio.inttegro.com/keys
        application = _load_application(self.env)
        return await asgi.fetch(application, request, self.env)
