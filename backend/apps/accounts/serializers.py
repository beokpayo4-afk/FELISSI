import re

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import Address, Customer
from apps.accounts.services import ensure_customer

PHONE_PATTERN = re.compile(r"^[6-9]\d{9}$")
PINCODE_PATTERN = re.compile(r"^\d{6}$")

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate_full_name(self, value: str) -> str:
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Enter your full name.")
        return name

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists() or Customer.objects.filter(
            email__iexact=email
        ).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate_phone(self, value: str) -> str:
        phone = re.sub(r"\D", "", value)
        if phone.startswith("91") and len(phone) == 12:
            phone = phone[2:]
        if not PHONE_PATTERN.match(phone):
            raise serializers.ValidationError("Enter a valid 10-digit Indian mobile number.")
        return phone

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
        )
        customer = Customer.objects.create(
            user=user,
            full_name=validated_data["full_name"].strip(),
            email=email,
            phone=validated_data["phone"].strip(),
        )
        return customer


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        password = attrs["password"]
        user = (
            User.objects.filter(email__iexact=email).first()
            or User.objects.filter(username__iexact=email).first()
        )
        if user is None or not user.check_password(password) or not user.is_active:
            raise serializers.ValidationError("Invalid email or password.")
        ensure_customer(user)
        attrs["user"] = user
        return attrs


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id",
            "full_name",
            "phone",
            "line1",
            "line2",
            "city",
            "state",
            "pincode",
            "country",
            "is_default",
        )
        read_only_fields = ("id",)

    def validate_full_name(self, value: str) -> str:
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Enter the recipient's full name.")
        return name

    def validate_phone(self, value: str) -> str:
        phone = re.sub(r"\D", "", value)
        if phone.startswith("91") and len(phone) == 12:
            phone = phone[2:]
        if not PHONE_PATTERN.match(phone):
            raise serializers.ValidationError("Enter a valid 10-digit Indian mobile number.")
        return phone

    def validate_line1(self, value: str) -> str:
        line = value.strip()
        if len(line) < 5:
            raise serializers.ValidationError("Enter a complete house or street address.")
        return line

    def validate_city(self, value: str) -> str:
        city = value.strip()
        if len(city) < 2:
            raise serializers.ValidationError("Enter a city.")
        return city

    def validate_state(self, value: str) -> str:
        state = value.strip()
        if len(state) < 2:
            raise serializers.ValidationError("Select a state.")
        return state

    def validate_pincode(self, value: str) -> str:
        pincode = value.strip()
        if not PINCODE_PATTERN.match(pincode):
            raise serializers.ValidationError("Enter a valid 6-digit PIN code.")
        return pincode


class CustomerSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)
    is_staff = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ("id", "full_name", "email", "phone", "is_staff", "addresses", "created_at")
        read_only_fields = fields

    def get_is_staff(self, obj: Customer) -> bool:
        return bool(obj.user_id and obj.user and obj.user.is_staff)


class UpdateProfileSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=15)

    def validate_full_name(self, value: str) -> str:
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Enter your full name.")
        return name

    def validate_phone(self, value: str) -> str:
        phone = re.sub(r"\D", "", value)
        if phone.startswith("91") and len(phone) == 12:
            phone = phone[2:]
        if not PHONE_PATTERN.match(phone):
            raise serializers.ValidationError("Enter a valid 10-digit Indian mobile number.")
        return phone


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate_new_password(self, value: str) -> str:
        if value.strip() != value or len(value.strip()) < 8:
            raise serializers.ValidationError("Use a password with at least 8 characters.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8, max_length=128)


