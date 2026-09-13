from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.accounts.services import consume_admin_handoff
from apps.accounts.views import (
    AddressViewSet,
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    ValidateAddressView,
)

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("admin-session/", consume_admin_handoff, name="auth-admin-session"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path(
        "password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
]

address_urlpatterns = [
    path("addresses/validate/", ValidateAddressView.as_view(), name="address-validate"),
    *router.urls,
]
