import os

from config.django_env import configure_settings_module
from django.core.asgi import get_asgi_application

if not os.environ.get("DJANGO_SETTINGS_MODULE"):
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.production"
configure_settings_module()

application = get_asgi_application()
