"""ASGI entry for `uvicorn main:app --reload`.

This project is Django, not FastAPI. `app` is the Django ASGI application.
"""

import os

from django.core.asgi import get_asgi_application

if not os.environ.get("DJANGO_SETTINGS_MODULE"):
    os.environ["DJANGO_SETTINGS_MODULE"] = (
        "config.settings.production" if os.environ.get("RENDER") else "config.settings.development"
    )

django_application = get_asgi_application()


async def app(scope, receive, send):
    if scope["type"] == "lifespan":
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                await send({"type": "lifespan.shutdown.complete"})
                return
        return
    await django_application(scope, receive, send)