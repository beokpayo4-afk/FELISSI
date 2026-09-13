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


# Render injects PORT. Bind publicly so the platform health check can reach the app.
bind = f"0.0.0.0:{_env_int('PORT', 8000)}"
workers = _env_int("WEB_CONCURRENCY", 3)
timeout = 60
accesslog = "-"
errorlog = "-"
worker_class = "uvicorn.workers.UvicornWorker"
