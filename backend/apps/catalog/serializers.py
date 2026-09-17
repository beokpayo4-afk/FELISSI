from decimal import Decimal

from rest_framework import serializers

from apps.core.models import StoreSettings
from apps.core.pricing import break_down_price

from apps.catalog.models import (
    Brand,
    Category,
    Product,
    ProductImage,
    ProductVariant,
    Review,
    SubCategory,
)
from apps.core.media import image_is_renderable, public_product_image_url


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ("id", "name", "slug")


class CategoryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class CategoryDetailSerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "subcategories")


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ("id", "name", "slug")


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "url", "alt_text", "sort_order", "is_primary")

    def get_url(self, obj: ProductImage) -> str:
        return public_product_image_url(obj)


def serialize_product_image(image: ProductImage | None) -> dict | None:
    if image is None:
        return None
    return ProductImageSerializer(image).data


def pick_product_image(obj: Product, *, public: bool = False) -> ProductImage | None:
    images = list(obj.images.all())
    if not images:
        return None
    if public:
        usable = [image for image in images if image_is_renderable(image)]
        if not usable:
            return None
        return next((image for image in usable if image.is_primary), usable[0])
    return next((image for image in images if image.is_primary), images[0])


class SearchProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategoryListSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ("id", "name", "slug", "sku", "price", "sale_price", "brand", "category", "primary_image")

    def get_primary_image(self, obj: Product) -> dict | None:
        return serialize_product_image(pick_product_image(obj, public=True))


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ("id", "name", "sku", "price", "stock_quantity")


class ProductListSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategoryListSerializer(read_only=True)
    subcategory = SubCategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    effective_price = serializers.SerializerMethodField()
    gst_inclusive = serializers.SerializerMethodField()
    taxable_price = serializers.SerializerMethodField()
    gst_amount = serializers.SerializerMethodField()
    inclusive_price = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "sku",
            "short_description",
            "brand",
            "category",
            "subcategory",
            "price",
            "sale_price",
            "effective_price",
            "average_rating",
            "review_count",
            "gst_percentage",
            "gst_inclusive",
            "taxable_price",
            "gst_amount",
            "inclusive_price",
            "stock_quantity",
            "is_featured",
            "is_best_seller",
            "primary_image",
            "created_at",
        )

    def get_primary_image(self, obj: Product) -> dict | None:
        return serialize_product_image(pick_product_image(obj, public=True))

    def get_effective_price(self, obj: Product) -> Decimal:
        return obj.sale_price if obj.sale_price is not None else obj.price

    def _gst_inclusive(self) -> bool:
        cached = self.context.get("gst_inclusive")
        if cached is None:
            cached = StoreSettings.gst_inclusive()
            self.context["gst_inclusive"] = cached
        return bool(cached)

    def _price_breakdown(self, obj: Product):
        return break_down_price(
            self.get_effective_price(obj),
            obj.gst_percentage,
            gst_inclusive=self._gst_inclusive(),
        )

    def get_gst_inclusive(self, obj: Product) -> bool:
        return self._gst_inclusive()

    def get_taxable_price(self, obj: Product) -> str:
        return f"{self._price_breakdown(obj).taxable_price:.2f}"

    def get_gst_amount(self, obj: Product) -> str:
        return f"{self._price_breakdown(obj).gst_amount:.2f}"

    def get_inclusive_price(self, obj: Product) -> str:
        return f"{self._price_breakdown(obj).inclusive_price:.2f}"


class ProductDetailSerializer(ProductListSerializer):
    images = serializers.SerializerMethodField()
    variants = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "description",
            "images",
            "variants",
            "updated_at",
        )

    def get_images(self, obj: Product) -> list:
        images = [image for image in obj.images.all() if image_is_renderable(image)]
        return ProductImageSerializer(images, many=True).data

    def get_variants(self, obj: Product) -> list:
        variants = [item for item in obj.variants.all() if item.is_active]
        return ProductVariantSerializer(variants, many=True).data


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "rating", "comment", "customer_name", "created_at")
        read_only_fields = ("id", "customer_name", "created_at")


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("rating", "comment")
