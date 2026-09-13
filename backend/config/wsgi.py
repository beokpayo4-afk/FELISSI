import os

from config.django_env import configure_settings_module
from django.core.wsgi import get_wsgi_application

# Explicit production remains the default for WSGI hosts that do not set RENDER.
if not os.environ.get("DJANGO_SETTINGS_MODULE"):
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.production"
configure_settings_module()

application = get_wsgi_application()
