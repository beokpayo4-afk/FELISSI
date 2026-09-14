from django.utils.text import slugify
from rest_framework import serializers

from apps.catalog.models import Brand, Category, Product, ProductImage, SubCategory
from apps.core.models import StoreSettings
from apps.orders.models import Order, OrderStatus, PaymentStatus


class StaffBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ("id", "name", "slug")


class StaffCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class StaffSubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ("id", "name", "slug", "category")


class StaffProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "url", "alt_text", "sort_order", "is_primary")


class StaffProductSerializer(serializers.ModelSerializer):
    brand = StaffBrandSerializer(read_only=True)
    category = StaffCategorySerializer(read_only=True)
    subcategory = StaffSubCategorySerializer(read_only=True)
    images = StaffProductImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "sku",
            "short_description",
            "description",
            "price",
            "sale_price",
            "gst_percentage",
            "stock_quantity",
            "is_published",
            "is_featured",
            "is_best_seller",
            "brand",
            "category",
            "subcategory",
            "images",
            "primary_image",
            "created_at",
        )

    def get_primary_image(self, obj: Product) -> dict | None:
        image = next((img for img in obj.images.all() if img.is_primary), None)
        if image is None:
            image = next(iter(obj.images.all()), None)
        if image is None:
            return None
        return StaffProductImageSerializer(image).data


class StaffProductImageWriteSerializer(serializers.Serializer):
    file = serializers.ImageField(required=False)
    url = serializers.CharField(required=False, allow_blank=True, max_length=500)
    alt_text = serializers.CharField(required=False, allow_blank=True, max_length=160)
    is_primary = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        uploaded = attrs.get("file")
        url = (attrs.get("url") or "").strip()
        if not uploaded and not url:
            raise serializers.ValidationError("Upload an image file or provide an image URL.")
        attrs["url"] = url
        return attrs


class StaffProductImageUpdateSerializer(serializers.Serializer):
    alt_text = serializers.CharField(required=False, allow_blank=True, max_length=160)
    is_primary = serializers.BooleanField(required=False)
    sort_order = serializers.IntegerField(required=False, min_value=0)


class StaffProductWriteSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, write_only=True)
    image_url = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Product
        fields = (
            "name",
            "sku",
            "short_description",
            "description",
            "brand",
            "category",
            "subcategory",
            "price",
            "sale_price",
            "gst_percentage",
            "stock_quantity",
            "is_published",
            "is_featured",
            "is_best_seller",
            "image",
            "image_url",
        )

    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        subcategory = attrs.get("subcategory") or getattr(self.instance, "subcategory", None)
        if category and subcategory and subcategory.category_id != category.id:
            raise serializers.ValidationError(
                {"subcategory": "Subcategory must belong to the selected category."}
            )
        return attrs

    def create(self, validated_data):
        uploaded = validated_data.pop("image", None)
        image_url = (validated_data.pop("image_url", "") or "").strip()
        name = validated_data["name"]
        base = slugify(name) or "product"
        slug = base
        suffix = 2
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base}-{suffix}"
            suffix += 1
        product = Product.objects.create(slug=slug, **validated_data)
        if uploaded:
            from apps.catalog.image_service import store_uploaded_product_image

            store_uploaded_product_image(product, uploaded, alt_text=product.name, is_primary=True)
        elif image_url:
            ProductImage.objects.create(
                product=product,
                url=image_url,
                alt_text=product.name,
                is_primary=True,
            )
        return product

    def update(self, instance, validated_data):
        uploaded = validated_data.pop("image", None)
        image_url = validated_data.pop("image_url", None)
        product = super().update(instance, validated_data)
        if uploaded is not None:
            from apps.catalog.image_service import store_uploaded_product_image

            store_uploaded_product_image(product, uploaded, alt_text=product.name, is_primary=True)
        elif image_url is not None:
            url = image_url.strip()
            if url:
                primary = product.images.filter(is_primary=True).first() or product.images.first()
                if primary:
                    primary.url = url
                    primary.save(update_fields=["url"])
                else:
                    ProductImage.objects.create(
                        product=product,
                        url=url,
                        alt_text=product.name,
                        is_primary=True,
                    )
        return product


class StaffOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "customer_name",
            "customer_email",
            "total",
            "payment_method",
            "payment_status",
            "order_status",
            "item_count",
            "created_at",
        )


class StaffOrderUpdateSerializer(serializers.Serializer):
    order_status = serializers.ChoiceField(choices=OrderStatus.choices, required=False)
    payment_status = serializers.ChoiceField(choices=PaymentStatus.choices, required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Provide an order or payment status to update.")
        return attrs


class StaffStoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = ("gst_inclusive_pricing",)


class StaffDashboardTotalsSerializer(serializers.Serializer):
    products = serializers.IntegerField()
    products_all = serializers.IntegerField()
    orders = serializers.IntegerField()
    orders_pending = serializers.IntegerField()
    customers = serializers.IntegerField()
    revenue = serializers.CharField()
    revenue_today = serializers.CharField()


class StaffDashboardSalesPointSerializer(serializers.Serializer):
    date = serializers.CharField()
    total = serializers.CharField()


class StaffDashboardOrderMixSerializer(serializers.Serializer):
    pending = serializers.IntegerField()
    paid = serializers.IntegerField()
    delivered = serializers.IntegerField()
    cancelled = serializers.IntegerField()


class StaffDashboardSerializer(serializers.Serializer):
    generated_at = serializers.CharField()
    timezone = serializers.CharField()
    totals = StaffDashboardTotalsSerializer()
    paid_orders = serializers.IntegerField()
    delivered = serializers.IntegerField()
    low_stock = serializers.IntegerField()
    pending_reviews = serializers.IntegerField()
    sales = StaffDashboardSalesPointSerializer(many=True)
    order_mix = StaffDashboardOrderMixSerializer()


class StaffOptionsSerializer(serializers.Serializer):
    brands = StaffBrandSerializer(many=True)
    categories = StaffCategorySerializer(many=True)
    subcategories = StaffSubCategorySerializer(many=True)
