from django.db import transaction
from django.urls import reverse
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Address
from apps.accounts.serializers import (
    AddressSerializer,
    ChangePasswordSerializer,
    CustomerSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
)
from apps.accounts.services import (
    RESET_ACK,
    create_admin_handoff,
    get_customer,
    request_password_reset,
    reset_password,
)
from apps.core.permissions import IsAuthenticatedCustomer


def auth_payload(request, user, customer):
    token, _ = Token.objects.get_or_create(user=user)
    payload = {
        "token": token.key,
        "customer": CustomerSerializer(customer).data,
        "is_staff": bool(user.is_staff),
    }
    handoff = create_admin_handoff(user)
    if handoff:
        payload["admin_url"] = request.build_absolute_uri(
            reverse("auth-admin-session") + f"?key={handoff}"
        )
    return payload


class RegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()
        return Response(
            auth_payload(request, customer.user, customer),
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response(auth_payload(request, user, get_customer(user)))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={204: None})
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticatedCustomer]
    serializer_class = CustomerSerializer

    def get(self, request):
        customer = get_customer(request.user)
        customer = type(customer).objects.prefetch_related("addresses").get(pk=customer.pk)
        return Response(CustomerSerializer(customer).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = get_customer(request.user)
        customer.full_name = serializer.validated_data["full_name"]
        customer.phone = serializer.validated_data["phone"]
        customer.save(update_fields=["full_name", "phone", "updated_at"])
        customer = type(customer).objects.prefetch_related("addresses").get(pk=customer.pk)
        return Response(CustomerSerializer(customer).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticatedCustomer]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            raise ValidationError({"current_password": "Current password is incorrect."})
        new_password = serializer.validated_data["new_password"]
        if user.check_password(new_password):
            raise ValidationError({"new_password": "Choose a different password."})
        user.set_password(new_password)
        user.save(update_fields=["password"])
        Token.objects.filter(user=user).delete()
        return Response(auth_payload(request, user, get_customer(user)))


class PasswordResetRequestView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_password_reset(serializer.validated_data["email"])
        return Response({"detail": RESET_ACK})


class PasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ok = reset_password(
            serializer.validated_data["uid"],
            serializer.validated_data["token"],
            serializer.validated_data["new_password"],
        )
        if not ok:
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": "Your password has been updated. You can sign in now."})


class ValidateAddressView(APIView):
    permission_classes = [IsAuthenticatedCustomer]
    serializer_class = AddressSerializer

    def post(self, request):
        serializer = AddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"valid": True, "address": serializer.validated_data})


class AddressViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticatedCustomer]
    serializer_class = AddressSerializer
    pagination_class = None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Address.objects.none()
        return Address.objects.filter(customer=get_customer(self.request.user))

    @transaction.atomic
    def perform_create(self, serializer):
        customer = get_customer(self.request.user)
        make_default = serializer.validated_data.get("is_default") or not Address.objects.filter(
            customer=customer
        ).exists()
        if make_default:
            Address.objects.filter(customer=customer, is_default=True).update(is_default=False)
        serializer.save(customer=customer, is_default=make_default)

    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.instance
        if serializer.validated_data.get("is_default"):
            Address.objects.filter(customer=instance.customer, is_default=True).exclude(
                pk=instance.pk
            ).update(is_default=False)
        serializer.save()

    @transaction.atomic
    def perform_destroy(self, instance):
        customer = instance.customer
        was_default = instance.is_default
        instance.delete()
        if was_default:
            replacement = Address.objects.filter(customer=customer).first()
            if replacement:
                replacement.is_default = True
                replacement.save(update_fields=["is_default", "updated_at"])
