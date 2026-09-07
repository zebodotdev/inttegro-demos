import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "inttegro-demo-development-only")
DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() == "true"
# The hosted demo is behind a known HTTPS reverse proxy. Keep both values
# explicit: ALLOWED_HOSTS controls which HTTP hosts Django serves, while
# CSRF_TRUSTED_ORIGINS controls which browser origins may submit unsafe methods.
ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get(
        "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver"
    ).split(",")
]
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]
# Only enable this when the deployment proxy overwrites X-Forwarded-Proto;
# trusting a client-controlled value would let callers spoof request.is_secure().
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "checkout",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
]
if os.environ.get("INTTEGRO_DEMO_CLOUDFLARE", "false").lower() != "true":
    # Docker/Uvicorn needs an ASGI-capable static-file layer. On Cloudflare,
    # Workers Static Assets serves /static/* before this application executes.
    MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
ROOT_URLCONF = "inttegro_demo.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": ["django.template.context_processors.request"]},
}]
WSGI_APPLICATION = "inttegro_demo.wsgi.application"
ASGI_APPLICATION = "inttegro_demo.asgi.application"
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR.parent / "public" / "static"
STORAGES = {
    "staticfiles": {
        "BACKEND": (
            "django.contrib.staticfiles.storage.StaticFilesStorage"
            if os.environ.get("INTTEGRO_DEMO_CLOUDFLARE", "false").lower() == "true"
            else "whitenoise.storage.CompressedManifestStaticFilesStorage"
        ),
    },
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
INTTEGRO_DEMO_PUBLIC_URL = os.environ.get("INTTEGRO_DEMO_PUBLIC_URL", "").strip()
