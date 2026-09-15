from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.core.media import serve_upload

admin.site.site_header = "VoltCart"
admin.site.site_title = "VoltCart admin"
admin.site.index_title = "Manage the store"

urlpatterns = [
    path("", RedirectView.as_view(url="/api/docs/", permanent=False), name="root"),
    path("api", RedirectView.as_view(url="/api/docs/", permanent=False)),
    path("api/", RedirectView.as_view(url="/api/docs/", permanent=False), name="api-root"),
    path("admin/", admin.site.urls),
    path("api/health/", include("apps.core.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="api-docs"),
    path("api/v1/staff/", include("apps.staff.urls")),
    path("api/v1/", include("config.api_urls")),
]

# Serve uploads from disk, then from PostgreSQL (Render disk is ephemeral).
urlpatterns += [
    re_path(r"^uploads/(?P<path>.*)$", serve_upload, name="uploaded-files"),
]
