from pathlib import Path

import dj_database_url
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173"]),
    CSRF_TRUSTED_ORIGINS=(list, ["http://localhost:5173"]),
    DJANGO_SECURE_SSL_REDIRECT=(bool, False),
)

environ.Env.read_env(BASE_DIR / ".env", overwrite=False)


def _csv_hosts(*candidates: str) -> list[str]:
    """Read the first non-empty comma-separated host list from the environment."""
    for name in candidates:
        raw = env.str(name, default="").strip()
        if not raw:
            continue
        return [host.strip() for host in raw.split(",") if host.strip()]
    return ["localhost", "127.0.0.1"]


def _env_bool(*candidates: str, default: bool = False) -> bool:
    for name in candidates:
        raw = env.str(name, default="")
        if raw == "":
            continue
        return raw.strip().lower() in ("true", "1", "yes", "on")
    return default


SECRET_KEY = env.str("DJANGO_SECRET_KEY", default="") or env.str("SECRET_KEY", default="")

# Prefer DJANGO_* names; also accept ALLOWED_HOSTS / DEBUG for Render dashboards.
ALLOWED_HOSTS = _csv_hosts("DJANGO_ALLOWED_HOSTS", "ALLOWED_HOSTS")
DEBUG = _env_bool("DJANGO_DEBUG", "DEBUG", default=False)

# Render injects this automatically — keep the service hostname allowed.
_render_host = env.str("RENDER_EXTERNAL_HOSTNAME", default="").strip()
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "django_filters",
    "drf_spectacular",
    "corsheaders",
    "apps.core.apps.CoreConfig",
    "apps.catalog.apps.CatalogConfig",
    "apps.accounts.apps.AccountsConfig",
    "apps.orders.apps.OrdersConfig",
    "apps.content.apps.ContentConfig",
    "apps.staff.apps.StaffConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASE_URL = env("DATABASE_URL", default="")
if DATABASE_URL:
    neon_or_ssl = "neon.tech" in DATABASE_URL or "sslmode=require" in DATABASE_URL
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=env.bool("DATABASE_SSL_REQUIRE", default=neon_or_ssl),
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-in"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Local filesystem uploads (served at /uploads/...).
UPLOADS_ROOT = BASE_DIR / "uploads"
UPLOAD_SUBDIRS = ("products", "categories", "banners")
MEDIA_URL = "/uploads/"
MEDIA_ROOT = UPLOADS_ROOT
UPLOAD_STORAGE_BACKEND = env("UPLOAD_STORAGE_BACKEND", default="")
FILE_UPLOAD_MAX_MEMORY_SIZE = 8 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.exceptions.api_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "VoltCart API",
    "DESCRIPTION": (
        "Electronics storefront API operated by FELISSI PRIVATE LIMITED. "
        "Product images are stored on the local filesystem and served at /uploads/."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = False
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT", "HEAD"]
CORS_EXPOSE_HEADERS = ["Content-Type", "Content-Length"]
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")

# Payment gateway — leave keys empty. Never put live credentials in the repo.
PAYMENT_PROVIDER = env("PAYMENT_PROVIDER", default="razorpay")
PAYMENT_KEY_ID = env("PAYMENT_KEY_ID", default="")
PAYMENT_KEY_SECRET = env("PAYMENT_KEY_SECRET", default="")

API_PUBLIC_ORIGIN = env("API_PUBLIC_ORIGIN", default="http://127.0.0.1:8000")
FRONTEND_ORIGIN = env("FRONTEND_ORIGIN", default="http://127.0.0.1:5175").rstrip("/")
FRONTEND_APP_NAME = env("FRONTEND_APP_NAME", default="VoltCart")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="filessipvtltd@gmail.com")
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)

# Keep CORS/CSRF aligned with FRONTEND_ORIGIN when it is a full http(s) origin.
if FRONTEND_ORIGIN.startswith(("http://", "https://")):
    if FRONTEND_ORIGIN not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(FRONTEND_ORIGIN)
    if FRONTEND_ORIGIN not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(FRONTEND_ORIGIN)
