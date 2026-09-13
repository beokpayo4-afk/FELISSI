from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.staff.views import (
    StaffDashboardView,
    StaffOptionsView,
    StaffOrderViewSet,
    StaffProductImageDetailView,
    StaffProductImageListCreateView,
    StaffProductViewSet,
    StaffStoreSettingsView,
)

router = DefaultRouter()
router.register("products", StaffProductViewSet, basename="staff-product")
router.register("orders", StaffOrderViewSet, basename="staff-order")

urlpatterns = [
    path("dashboard/", StaffDashboardView.as_view(), name="staff-dashboard"),
    path("options/", StaffOptionsView.as_view(), name="staff-options"),
    path("settings/", StaffStoreSettingsView.as_view(), name="staff-settings"),
    path(
        "products/<uuid:product_id>/images/",
        StaffProductImageListCreateView.as_view(),
        name="staff-product-images",
    ),
    path(
        "products/<uuid:product_id>/images/<int:image_id>/",
        StaffProductImageDetailView.as_view(),
        name="staff-product-image-detail",
    ),
    *router.urls,
]
