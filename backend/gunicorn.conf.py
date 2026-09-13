"""Optional Gunicorn defaults for local/manual runs.

Production on Render uses the explicit start command (no -c flag):

  gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT

You may still use this file for worker count / logging when running:

  gunicorn config.asgi:application -c gunicorn.conf.py

CLI flags override values set here when both are provided.
"""

import os


def _env_int(name: str, default: int, *, minimum: int = 1) -> int:
    raw = os.environ.get(name)
    if raw is None or not str(raw).strip():
        return default
    try:
        value = int(str(raw).strip())
    except ValueError:
        return default
    if value < minimum:
        return default
    return value


# Used only when this file is loaded via `gunicorn ... -c gunicorn.conf.py`.
bind = f"0.0.0.0:{_env_int('PORT', 8000)}"
workers = _env_int("WEB_CONCURRENCY", 3)
timeout = 60
accesslog = "-"
errorlog = "-"
worker_class = "uvicorn.workers.UvicornWorker"