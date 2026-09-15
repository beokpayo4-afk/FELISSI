from .base import *  # noqa: F403
from .base import (
    ALLOWED_HOSTS,
    CORS_ALLOWED_ORIGIN_REGEXES,
    CORS_ALLOWED_ORIGINS,
    CSRF_TRUSTED_ORIGINS,
    DATABASES,
    DATABASE_URL,
    SECRET_KEY,
    STORAGES,
    _ensure_origin_list,
    env,
)
from django.core.checks.security.base import (
    SECRET_KEY_INSECURE_PREFIX,
    SECRET_KEY_MIN_LENGTH,
    SECRET_KEY_MIN_UNIQUE_CHARACTERS,
)

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

# Match Django security.W009: length, unique characters, and insecure prefix.
# Render's generateValue is only ~44 chars — paste a longer key (e.g. Django's
# get_random_secret_key()) instead of relying on generateValue alone.
_secret = str(SECRET_KEY or "").strip()
_secret_l = _secret.lower()
if (
    not _secret
    or len(_secret) < SECRET_KEY_MIN_LENGTH
    or len(set(_secret)) < SECRET_KEY_MIN_UNIQUE_CHARACTERS
    or _secret.startswith(SECRET_KEY_INSECURE_PREFIX)
    or _secret_l in _PLACEHOLDER_SECRETS
    or _secret_l.startswith("replace-with")
    or _secret_l.startswith("django-insecure")
    or _secret_l.startswith("change-me")
):
    raise ValueError(
        "DJANGO_SECRET_KEY (or SECRET_KEY) must meet Django's production rules "
        f"(at least {SECRET_KEY_MIN_LENGTH} characters, "
        f"at least {SECRET_KEY_MIN_UNIQUE_CHARACTERS} unique characters, "
        f"not a placeholder; got length={len(_secret)}, "
        f"unique={len(set(_secret)) if _secret else 0}). "
        "In Render → Environment, paste a long random string "
        '(python -c "from django.core.management.utils import get_random_secret_key; '
        'print(get_random_secret_key())"). Render Generate alone is often too short.'
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

CORS_ALLOWED_ORIGINS = _ensure_origin_list(CORS_ALLOWED_ORIGINS)
CSRF_TRUSTED_ORIGINS = _ensure_origin_list(CSRF_TRUSTED_ORIGINS)
CORS_ALLOWED_ORIGIN_REGEXES = list(CORS_ALLOWED_ORIGIN_REGEXES)

_PRODUCTION_STOREFRONT = "https://felissi-f.vercel.app"
_production_frontend = env.str("FRONTEND_ORIGIN", default="").strip().rstrip("/")
if _production_frontend.startswith("https://"):
    FRONTEND_ORIGIN = _production_frontend
else:
    FRONTEND_ORIGIN = _PRODUCTION_STOREFRONT

for _origin in (_PRODUCTION_STOREFRONT, FRONTEND_ORIGIN):
    if _origin.startswith("https://") and _origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(_origin)
    if _origin.startswith("https://") and _origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_origin)

_vercel_preview = r"^https://felissi-[a-z0-9-]+\.vercel\.app$"
if _vercel_preview not in CORS_ALLOWED_ORIGIN_REGEXES:
    CORS_ALLOWED_ORIGIN_REGEXES.append(_vercel_preview)
