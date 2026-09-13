from .base import *  # noqa: F403
from .base import (
    ALLOWED_HOSTS,
    DATABASES,
    OBJECT_STORAGE_ACCESS_KEY_ID,
    OBJECT_STORAGE_BUCKET_NAME,
    OBJECT_STORAGE_ENDPOINT_URL,
    OBJECT_STORAGE_PUBLIC_BASE_URL,
    OBJECT_STORAGE_SECRET_ACCESS_KEY,
    SECRET_KEY,
    STORAGES,
    env,
)

# Never expose Django's debug traceback page in production.
DEBUG = False

if not SECRET_KEY or str(SECRET_KEY).startswith("replace-with"):
    raise ValueError("DJANGO_SECRET_KEY (or SECRET_KEY) must be set to a real secret in production.")

if DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3":
    raise ValueError("Production must use PostgreSQL via DATABASE_URL.")

if not all(
    (
        OBJECT_STORAGE_ENDPOINT_URL,
        OBJECT_STORAGE_ACCESS_KEY_ID,
        OBJECT_STORAGE_SECRET_ACCESS_KEY,
        OBJECT_STORAGE_BUCKET_NAME,
        OBJECT_STORAGE_PUBLIC_BASE_URL,
    )
):
    raise ValueError(
        "Production requires S3-compatible object storage. Set OBJECT_STORAGE_ENDPOINT_URL, "
        "OBJECT_STORAGE_ACCESS_KEY_ID, OBJECT_STORAGE_SECRET_ACCESS_KEY, "
        "OBJECT_STORAGE_BUCKET_NAME, and OBJECT_STORAGE_PUBLIC_BASE_URL."
    )

STORAGES["staticfiles"]["BACKEND"] = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Defense in depth: ensure the Render service hostname is always permitted.
render_host = env.str("RENDER_EXTERNAL_HOSTNAME", default="").strip()
if render_host and render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_host)
