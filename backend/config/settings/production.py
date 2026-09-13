from .base import *  # noqa: F403
from .base import ALLOWED_HOSTS, DATABASES, DATABASE_URL, SECRET_KEY, STORAGES, env

# Never expose Django's debug traceback page in production.
DEBUG = False

_PLACEHOLDER_SECRETS = {
    "",
    "replace-with-a-local-random-value",
    "change-me",
    "changeme",
    "your-secret-key",
    "secret",
    "secret-key",
    "django-insecure",
    "test",
    "testing",
}

_secret = str(SECRET_KEY or "").strip()
_secret_l = _secret.lower()
if (
    not _secret
    or len(_secret) < 50
    or _secret_l in _PLACEHOLDER_SECRETS
    or _secret_l.startswith("replace-with")
    or _secret_l.startswith("django-insecure")
    or _secret_l.startswith("change-me")
):
    raise ValueError(
        "DJANGO_SECRET_KEY (or SECRET_KEY) must be set to a real secret in production "
        "(at least 50 characters, not a placeholder). Use Render's generateValue or "
        "a long random string."
    )

if not (DATABASE_URL or "").strip():
    raise ValueError(
        "DATABASE_URL must be set in production. "
        "Paste your Neon PostgreSQL connection string in the Render Environment tab."
    )

if DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3":
    raise ValueError("Production must use PostgreSQL via DATABASE_URL. SQLite is not allowed.")

engine = DATABASES["default"]["ENGINE"]
if "postgresql" not in engine and "postgres" not in engine:
    raise ValueError(
        "Production DATABASE_URL must point at PostgreSQL "
        f"(got ENGINE={engine!r})."
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
