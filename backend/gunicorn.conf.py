import os

# Render injects PORT. Bind publicly so the platform health check can reach the app.
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = int(os.environ.get("WEB_CONCURRENCY", "3"))
timeout = 60
accesslog = "-"
errorlog = "-"
worker_class = "uvicorn.workers.UvicornWorker"
