import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth import login as django_login
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.shortcuts import redirect
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.authtoken.models import Token

from apps.accounts.models import Customer
from apps.core.company import EMAIL as COMPANY_EMAIL
from apps.core.company import LEGAL_NAME

User = get_user_model()
logger = logging.getLogger(__name__)

RESET_ACK = "If an account exists for that email, password reset instructions have been sent."
ADMIN_HANDOFF_SALT = "voltcart-admin-handoff"
ADMIN_HANDOFF_MAX_AGE = 120


def create_admin_handoff(user) -> str | None:
    if not user.is_active or not user.is_staff:
        return None
    return TimestampSigner(salt=ADMIN_HANDOFF_SALT).sign(str(user.pk))


def consume_admin_handoff(request):
    key = request.GET.get("key", "")
    try:
        user_id = TimestampSigner(salt=ADMIN_HANDOFF_SALT).unsign(key, max_age=ADMIN_HANDOFF_MAX_AGE)
    except (BadSignature, SignatureExpired, ValueError, TypeError):
        return redirect("/admin/login/?next=/admin/")
    user = User.objects.filter(pk=user_id, is_active=True, is_staff=True).first()
    if user is None:
        return redirect("/admin/login/?next=/admin/")
    django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    return redirect("/admin/")


def get_customer(user) -> Customer:
    return Customer.objects.select_related("user").get(user=user)


def ensure_customer(user) -> Customer:
    existing = Customer.objects.filter(user=user).first()
    if existing:
        return existing

    email = (user.email or user.username or "").strip().lower()
    orphan = Customer.objects.filter(email__iexact=email, user__isnull=True).first()
    if orphan:
        orphan.user = user
        orphan.save(update_fields=["user"])
        return orphan

    full_name = user.get_full_name().strip() or email.split("@")[0] or "Customer"
    return Customer.objects.create(
        user=user,
        full_name=full_name[:150],
        email=email or f"user-{user.pk}@voltcart.local",
        phone="9999999999",
    )


def request_password_reset(email: str) -> None:
    user = User.objects.filter(email__iexact=email.strip().lower(), is_active=True).first()
    if user is None or not Customer.objects.filter(user=user).exists():
        return

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    origin = settings.FRONTEND_ORIGIN.rstrip("/")
    link = f"{origin}/forgot-password?uid={uid}&token={token}"
    try:
        send_mail(
            subject=f"Reset your {settings.FRONTEND_APP_NAME} password",
            message=(
                f"Use this link to choose a new password. It expires after a short time.\n\n{link}\n\n"
                f"If you did not request this, you can ignore this email.\n\n{LEGAL_NAME}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL or COMPANY_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        logger.exception("Password reset email could not be sent.")


def user_from_reset_uid(uid: str):
    try:
        decoded = force_str(urlsafe_base64_decode(uid))
        return User.objects.filter(pk=decoded, is_active=True).first()
    except (ValueError, TypeError, OverflowError):
        return None


def reset_password(uid: str, token: str, new_password: str) -> bool:
    user = user_from_reset_uid(uid)
    if user is None or not default_token_generator.check_token(user, token):
        return False
    if not Customer.objects.filter(user=user).exists():
        return False
    user.set_password(new_password)
    user.save(update_fields=["password"])
    Token.objects.filter(user=user).delete()
    return True
