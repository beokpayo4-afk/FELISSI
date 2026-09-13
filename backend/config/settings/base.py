from pathlib import Path

import dj_database_url
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173"]),
    CSRF_TRUSTED_ORIGINS=(list, ["http://localhost:5173"]),
    DJANGO_SECURE_SSL_REDIRECT=(bool, False),
)

environ.Env.read_env(BASE_DIR / ".env", overwrite=False)

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DJANGO_DEBUG")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

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
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

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
    "DESCRIPTION": "Electronics storefront API operated by FELISSI PRIVATE LIMITED. Product images are served as object-storage URLs.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = False
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")

# S3-compatible object storage for product images. Prefer OBJECT_STORAGE_*; R2_* still works.
OBJECT_STORAGE_ENDPOINT_URL = env("OBJECT_STORAGE_ENDPOINT_URL", default="") or env("R2_ENDPOINT_URL", default="")
OBJECT_STORAGE_ACCESS_KEY_ID = env("OBJECT_STORAGE_ACCESS_KEY_ID", default="") or env(
    "R2_ACCESS_KEY_ID", default=""
)
OBJECT_STORAGE_SECRET_ACCESS_KEY = env("OBJECT_STORAGE_SECRET_ACCESS_KEY", default="") or env(
    "R2_SECRET_ACCESS_KEY", default=""
)
OBJECT_STORAGE_BUCKET_NAME = env("OBJECT_STORAGE_BUCKET_NAME", default="") or env("R2_BUCKET_NAME", default="")
OBJECT_STORAGE_PUBLIC_BASE_URL = env("OBJECT_STORAGE_PUBLIC_BASE_URL", default="") or env(
    "R2_PUBLIC_BASE_URL", default=""
)
OBJECT_STORAGE_REGION = env("OBJECT_STORAGE_REGION", default="auto")
OBJECT_STORAGE_BACKEND = env("OBJECT_STORAGE_BACKEND", default="")
R2_ACCOUNT_ID = env("R2_ACCOUNT_ID", default="")

# Payment gateway — leave keys empty. Never put live credentials in the repo.
PAYMENT_PROVIDER = env("PAYMENT_PROVIDER", default="razorpay")
PAYMENT_KEY_ID = env("PAYMENT_KEY_ID", default="")
PAYMENT_KEY_SECRET = env("PAYMENT_KEY_SECRET", default="")

API_PUBLIC_ORIGIN = env("API_PUBLIC_ORIGIN", default="http://127.0.0.1:8000")
FRONTEND_ORIGIN = env("FRONTEND_ORIGIN", default="http://127.0.0.1:5175")
FRONTEND_APP_NAME = env("FRONTEND_APP_NAME", default="VoltCart")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="filessipvtltd@gmail.com")
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
