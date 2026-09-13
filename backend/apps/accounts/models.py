import uuid

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import TimeStampedModel

PINCODE_VALIDATOR = RegexValidator(r"^\d{6}$", "Enter a 6-digit PIN code.")


class Customer(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="customer",
        null=True,
        blank=True,
    )
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["email"]), models.Index(fields=["phone"])]

    def __str__(self) -> str:
        return self.full_name


class Address(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    line1 = models.CharField(max_length=160)
    line2 = models.CharField(max_length=160, blank=True)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=80)
    pincode = models.CharField(max_length=6, validators=[PINCODE_VALIDATOR])
    country = models.CharField(max_length=64, default="India")
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Addresses"
        ordering = ["-is_default", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer"],
                condition=models.Q(is_default=True),
                name="accounts_one_default_address_per_customer",
            )
        ]
        indexes = [models.Index(fields=["customer", "is_default"])]

    def __str__(self) -> str:
        return f"{self.full_name}, {self.city}"
