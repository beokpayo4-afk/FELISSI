from .base import *  # noqa: F403

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
OBJECT_STORAGE_BACKEND = "memory"

SILENCED_SYSTEM_CHECKS = ["models.W047"]
