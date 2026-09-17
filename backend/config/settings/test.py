from .base import *  # noqa: F403
from .base import _ensure_origin_list

DEBUG = True
SECRET_KEY = "test-settings-not-for-production"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
FRONTEND_ORIGIN = "http://testserver"
UPLOAD_STORAGE_BACKEND = "memory"
UPI_VPA = ""
UPI_PAYEE_NAME = "FELISSI PRIVATE LIMITED"
PAYMENT_KEY_ID = ""
PAYMENT_KEY_SECRET = ""

CORS_ALLOWED_ORIGINS = _ensure_origin_list(CORS_ALLOWED_ORIGINS)  # noqa: F405
CSRF_TRUSTED_ORIGINS = _ensure_origin_list(CSRF_TRUSTED_ORIGINS)  # noqa: F405
CORS_ALLOWED_ORIGIN_REGEXES = list(CORS_ALLOWED_ORIGIN_REGEXES)  # noqa: F405

SILENCED_SYSTEM_CHECKS = ["models.W047"]
