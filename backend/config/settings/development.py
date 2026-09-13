from .base import *  # noqa: F403
from .base import CORS_ALLOWED_ORIGINS, CSRF_TRUSTED_ORIGINS, _env_bool

# Local default is True; override with DJANGO_DEBUG=false / DEBUG=false if needed.
DEBUG = _env_bool("DJANGO_DEBUG", "DEBUG", default=True)

for port in range(5173, 5177):
    for origin in (f"http://localhost:{port}", f"http://127.0.0.1:{port}"):
        if origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(origin)
        if origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(origin)

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
