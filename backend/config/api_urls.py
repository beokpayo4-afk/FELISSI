from django.urls import include, path

from apps.accounts.urls import address_urlpatterns
from apps.core.views import PublicStoreSettingsView

urlpatterns = [
    path("auth/", include("apps.accounts.urls")),
    path("staff/", include("apps.staff.urls")),
    path("store/settings/", PublicStoreSettingsView.as_view(), name="store-settings"),
    path("", include(address_urlpatterns)),
    path("", include("apps.catalog.urls")),
    path("", include("apps.orders.urls")),
]
