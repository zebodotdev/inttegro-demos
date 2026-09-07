"""Cloudflare Workers ASGI entry point for the same FastAPI application."""

from workers import asgi

from app.main import app


# INTTEGRO:DECISION [framework-adapter] Cloudflare supplies the ASGI server;
# the routes and Inttegro integration stay framework-native and are shared with
# the Uvicorn/Docker deployment. Avoid maintaining a second checkout handler.
# INTTEGRO:DOCS https://studio.inttegro.com/sdks/python
Default = asgi.entrypoint(app)
