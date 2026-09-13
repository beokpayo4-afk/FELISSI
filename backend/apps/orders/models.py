import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q, UniqueConstraint
from django.utils import timezone

from apps.core.models import TimeStampedModel


class DiscountType(models.TextChoices):
    PERCENT = "percent", "Percent"
    FLAT = "flat", "Flat"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"


class PaymentMethod(models.TextChoices):
    COD = "cod", "Cash on delivery"
    ONLINE = "online", "Online"


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    PROCESSING = "processing", "Processing"
    SHIPPED = "shipped", "Shipped"
    DELIVERED = "delivered", "Delivered"
    CANCELLED = "cancelled", "Cancelled"


class Coupon(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=40, unique=True)
    discount_type = models.CharField(max_length=10, choices=DiscountType.choices)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    min_order_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["code"]), models.Index(fields=["is_active", "valid_to"])]
        constraints = [
            models.CheckConstraint(condition=Q(amount__gte=0), name="orders_coupon_amount_gte_0"),
            models.CheckConstraint(
                condition=Q(valid_to__gte=models.F("valid_from")),
                name="orders_coupon_valid_range",
            ),
        ]

    def __str__(self) -> str:
        return self.code

    def clean(self) -> None:
        if self.valid_from and self.valid_to and self.valid_to < self.valid_from:
            raise ValidationError({"valid_to": "End date must be on or after the start date."})
        if self.discount_type == DiscountType.PERCENT and self.amount is not None:
            if self.amount > Decimal("100.00"):
                raise ValidationError({"amount": "Percent discount cannot exceed 100."})

    def save(self, *args, **kwargs) -> None:
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)


class Cart(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.OneToOneField(
        "accounts.Customer",
        on_delete=models.CASCADE,
        related_name="cart",
    )

    class Meta:
        indexes = [models.Index(fields=["customer"])]

    def __str__(self) -> str:
        return f"Cart {self.customer_id}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.CASCADE,
        related_name="cart_items",
        null=True,
        blank=True,
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["cart", "product", "variant"],
                nulls_distinct=False,
                name="orders_unique_cart_item",
            ),
            models.CheckConstraint(
                condition=Q(quantity__gte=1),
                name="orders_cart_item_quantity_gte_1",
            ),
        ]
        indexes = [models.Index(fields=["cart", "product"])]

    def __str__(self) -> str:
        return f"{self.product_id} x {self.quantity}"

    def clean(self) -> None:
        if self.variant_id and self.product_id:
            if self.variant.product_id != self.product_id:
                raise ValidationError({"variant": "Variant must belong to the selected product."})


class Order(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=24, unique=True, editable=False)
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.PROTECT,
        related_name="orders",
    )
    shipping_address = models.ForeignKey(
        "accounts.Address",
        on_delete=models.PROTECT,
        related_name="orders",
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    gst = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    shipping_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    gst_inclusive = models.BooleanField(
        default=False,
        help_text="Snapshot of store GST mode when the order was placed.",
    )
    payment_method = models.CharField(
        max_length=16,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
    )
    payment_status = models.CharField(
        max_length=16,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    client_request_id = models.CharField(max_length=64, blank=True, default="")
    order_status = models.CharField(
        max_length=16,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order_number"]),
            models.Index(fields=["customer", "created_at"]),
            models.Index(fields=["payment_status"]),
            models.Index(fields=["order_status"]),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(subtotal__gte=0), name="orders_subtotal_gte_0"),
            models.CheckConstraint(condition=Q(discount__gte=0), name="orders_discount_gte_0"),
            models.CheckConstraint(condition=Q(gst__gte=0), name="orders_gst_gte_0"),
            models.CheckConstraint(
                condition=Q(shipping_charge__gte=0),
                name="orders_shipping_charge_gte_0",
            ),
            models.CheckConstraint(condition=Q(total__gte=0), name="orders_total_gte_0"),
            UniqueConstraint(
                fields=["customer", "client_request_id"],
                condition=Q(client_request_id__gt=""),
                name="orders_unique_client_request_id",
            ),
        ]

    def __str__(self) -> str:
        return self.order_number

    def clean(self) -> None:
        if self.shipping_address_id and self.customer_id:
            if self.shipping_address.customer_id != self.customer_id:
                raise ValidationError(
                    {"shipping_address": "Address must belong to the order customer."}
                )

    def save(self, *args, **kwargs) -> None:
        if not self.order_number:
            self.order_number = (
                f"VC{timezone.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
            )
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.PROTECT,
        related_name="order_items",
        null=True,
        blank=True,
    )
    product_name = models.CharField(max_length=200)
    sku = models.CharField(max_length=64)
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    gst_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    taxable_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    gst_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gte=1),
                name="orders_order_item_quantity_gte_1",
            ),
            models.CheckConstraint(
                condition=Q(unit_price__gte=0),
                name="orders_order_item_unit_price_gte_0",
            ),
        ]
        indexes = [models.Index(fields=["order"])]

    def __str__(self) -> str:
        return f"{self.sku} x {self.quantity}"

    def clean(self) -> None:
        if self.variant_id and self.product_id:
            if self.variant.product_id != self.product_id:
                raise ValidationError({"variant": "Variant must belong to the selected product."})


class Wishlist(models.Model):
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="wishlisted_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            UniqueConstraint(
                fields=["customer", "product"],
                name="orders_unique_wishlist_item",
            )
        ]
        indexes = [models.Index(fields=["customer", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.customer_id} / {self.product_id}"
