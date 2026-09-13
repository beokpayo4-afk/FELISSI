from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

admin.site.site_header = "VoltCart"
admin.site.site_title = "VoltCart admin"
admin.site.index_title = "Manage the store"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", include("apps.core.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="api-docs"),
    path("api/v1/staff/", include("apps.staff.urls")),
    path("api/v1/", include("config.api_urls")),
]

# Serve local uploads in development and on Render (WhiteNoise does not serve MEDIA).
# Paths are constrained under MEDIA_ROOT by django.views.static.serve.
urlpatterns += [
    re_path(
        r"^uploads/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT},
        name="uploaded-files",
    ),
]
