import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F, Q, UniqueConstraint
from django.utils.text import slugify

from apps.core.models import TimeStampedModel


class Category(TimeStampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Categories"
        indexes = [models.Index(fields=["is_active", "name"])]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class SubCategory(TimeStampedModel):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="subcategories",
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Subcategory"
        verbose_name_plural = "Subcategories"
        constraints = [
            UniqueConstraint(
                fields=["category", "slug"],
                name="catalog_subcategory_unique_slug_per_category",
            )
        ]
        indexes = [models.Index(fields=["category", "is_active"])]

    def __str__(self) -> str:
        return f"{self.category.name} / {self.name}"

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Brand(TimeStampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["is_active", "name"])]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    sku = models.CharField(max_length=64, unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=255)
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name="products")
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )
    subcategory = models.ForeignKey(
        SubCategory,
        on_delete=models.PROTECT,
        related_name="products",
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="MRP. Inclusive or exclusive of GST depends on store settings.",
    )
    sale_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Selling price. Inclusive or exclusive of GST depends on store settings.",
    )
    gst_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("18.00"),
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))],
        help_text="GST rate for this product. Do not use one store-wide rate.",
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField("published", default=False)
    is_featured = models.BooleanField("featured", default=False)
    is_best_seller = models.BooleanField("best seller", default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["name"]),
            models.Index(fields=["is_published", "name"]),
            models.Index(fields=["category", "is_published"]),
            models.Index(fields=["brand", "is_published"]),
            models.Index(fields=["is_featured", "is_published"]),
            models.Index(fields=["is_best_seller", "is_published"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(price__gte=0),
                name="catalog_product_price_gte_0",
            ),
            models.CheckConstraint(
                condition=Q(sale_price__isnull=True) | Q(sale_price__gte=0),
                name="catalog_product_sale_price_gte_0",
            ),
            models.CheckConstraint(
                condition=Q(sale_price__isnull=True) | Q(sale_price__lte=F("price")),
                name="catalog_product_sale_price_lte_price",
            ),
            models.CheckConstraint(
                condition=Q(gst_percentage__gte=0) & Q(gst_percentage__lte=100),
                name="catalog_product_gst_range",
            ),
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self) -> None:
        if self.subcategory_id and self.category_id:
            if self.subcategory.category_id != self.category_id:
                raise ValidationError(
                    {"subcategory": "Subcategory must belong to the selected category."}
                )
        if self.sale_price is not None and self.price is not None:
            if self.sale_price > self.price:
                raise ValidationError({"sale_price": "Sale price cannot exceed price."})

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField("upload", upload_to="products/", blank=True)
    url = models.CharField(
        max_length=500,
        blank=True,
        help_text="Public path for the image, e.g. /uploads/products/<filename>.",
    )
    storage_key = models.CharField(max_length=255, blank=True)
    alt_text = models.CharField(max_length=160, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["sort_order", "id"]
        constraints = [
            UniqueConstraint(
                fields=["product"],
                condition=Q(is_primary=True),
                name="catalog_one_primary_image_per_product",
            )
        ]
        indexes = [models.Index(fields=["product", "sort_order"])]

    def __str__(self) -> str:
        return self.alt_text or f"Image for {self.product_id}"

    def clean(self) -> None:
        if not self.image and not (self.url or "").strip():
            raise ValidationError("Upload an image or provide an image URL.")

    def save(self, *args, **kwargs) -> None:
        incoming = self.image
        if incoming and not getattr(incoming, "_committed", True):
            from apps.catalog.image_service import persist_admin_upload

            persist_admin_upload(self, incoming)
        super().save(*args, **kwargs)
        if self.image and not self.url:
            public_url = self.image.url
            if self.url != public_url:
                self.url = public_url
                super().save(update_fields=["url"])


class InventoryItem(Product):
    class Meta:
        proxy = True
        verbose_name = "Inventory item"
        verbose_name_plural = "Inventory"


class ProductVariant(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    name = models.CharField(max_length=120)
    sku = models.CharField(max_length=64, unique=True)
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Leave blank to use the product price.",
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            UniqueConstraint(
                fields=["product", "name"],
                name="catalog_unique_variant_name_per_product",
            ),
            models.CheckConstraint(
                condition=Q(price__isnull=True) | Q(price__gte=0),
                name="catalog_variant_price_gte_0",
            ),
        ]
        indexes = [models.Index(fields=["product", "is_active"])]

    def __str__(self) -> str:
        return f"{self.product.name} — {self.name}"


class Review(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    is_approved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            UniqueConstraint(
                fields=["product", "customer"],
                name="catalog_one_review_per_customer_product",
            ),
            models.CheckConstraint(
                condition=Q(rating__gte=1) & Q(rating__lte=5),
                name="catalog_review_rating_range",
            ),
        ]
        indexes = [models.Index(fields=["product", "is_approved"])]

    def __str__(self) -> str:
        return f"{self.rating}/5 on {self.product_id}"
