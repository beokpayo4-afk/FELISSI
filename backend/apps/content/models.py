from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import TimeStampedModel


class BannerPlacement(models.TextChoices):
    HERO = "hero", "Hero"
    PROMO = "promo", "Promo"
    SLIDE = "slide", "Carousel"


class Banner(TimeStampedModel):
    placement = models.CharField(max_length=16, choices=BannerPlacement.choices)
    eyebrow = models.CharField(max_length=80, blank=True)
    title = models.CharField(max_length=200)
    subtitle = models.TextField(blank=True)
    image = models.ImageField(upload_to="banners/%Y/%m/", blank=True)
    image_alt = models.CharField(max_length=160, blank=True)
    button_label = models.CharField(max_length=80, blank=True)
    button_url = models.CharField(max_length=255, blank=True)
    secondary_button_label = models.CharField(max_length=80, blank=True)
    secondary_button_url = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]
        indexes = [
            models.Index(fields=["placement", "is_active", "sort_order"]),
        ]

    def __str__(self) -> str:
        return f"{self.get_placement_display()}: {self.title}"

    def clean(self) -> None:
        if self.starts_at and self.ends_at and self.ends_at < self.starts_at:
            raise ValidationError({"ends_at": "End time must be on or after the start time."})


class HomepageSectionType(models.TextChoices):
    FEATURED_CATEGORIES = "featured_categories", "Featured categories"
    BEST_SELLERS = "best_sellers", "Best sellers"
    NEW_ARRIVALS = "new_arrivals", "New arrivals"
    FEATURED_PRODUCTS = "featured_products", "Featured products"
    CATEGORY = "category", "Category products"
    CUSTOM = "custom", "Selected products"


class HomepageSection(TimeStampedModel):
    section_type = models.CharField(max_length=32, choices=HomepageSectionType.choices)
    eyebrow = models.CharField(max_length=80, blank=True)
    title = models.CharField(max_length=160)
    action_label = models.CharField(max_length=80, blank=True)
    action_url = models.CharField(max_length=255, blank=True)
    category = models.ForeignKey(
        "catalog.Category",
        on_delete=models.SET_NULL,
        related_name="homepage_sections",
        null=True,
        blank=True,
    )
    products = models.ManyToManyField(
        "catalog.Product",
        related_name="homepage_sections",
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Homepage section"
        verbose_name_plural = "Homepage sections"
        indexes = [models.Index(fields=["is_active", "sort_order"])]

    def __str__(self) -> str:
        return self.title

    def clean(self) -> None:
        if self.section_type == HomepageSectionType.CATEGORY and not self.category_id:
            raise ValidationError({"category": "Choose a category for this section."})
