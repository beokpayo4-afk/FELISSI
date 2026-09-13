from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html

from apps.core.admin_utils import image_preview

from .models import (
    Brand,
    Category,
    InventoryItem,
    Product,
    ProductImage,
    ProductVariant,
    Review,
    SubCategory,
)


class SubCategoryInline(admin.TabularInline):
    model = SubCategory
    extra = 0
    prepopulated_fields = {"slug": ("name",)}
    fields = ("name", "slug", "is_active")


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("preview", "image", "url", "storage_key", "alt_text", "sort_order", "is_primary")
    readonly_fields = ("preview", "storage_key")

    @admin.display(description="Preview")
    def preview(self, obj: ProductImage) -> str:
        return image_preview(obj.image.url if obj.image else obj.url, obj.alt_text)


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = ("name", "sku", "price", "stock_quantity", "is_active")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "product_count", "is_active", "updated_at")
    list_filter = ("is_active",)
    list_editable = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = (SubCategoryInline,)
    ordering = ("name",)
    list_per_page = 50

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_product_count=Count("products"))

    @admin.display(description="Products", ordering="_product_count")
    def product_count(self, obj: Category) -> int:
        return obj._product_count


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "slug", "is_active", "updated_at")
    list_filter = ("is_active", "category")
    list_editable = ("is_active",)
    search_fields = ("name", "slug", "category__name")
    autocomplete_fields = ("category",)
    prepopulated_fields = {"slug": ("name",)}
    list_select_related = ("category",)
    ordering = ("category__name", "name")


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "product_count", "is_active", "updated_at")
    list_filter = ("is_active",)
    list_editable = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("name",)

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_product_count=Count("products"))

    @admin.display(description="Products", ordering="_product_count")
    def product_count(self, obj: Brand) -> int:
        return obj._product_count


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sku",
        "brand",
        "category",
        "price",
        "sale_price",
        "gst_percentage",
        "stock_quantity",
        "is_published",
        "is_featured",
        "is_best_seller",
    )
    list_filter = (
        "is_published",
        "is_featured",
        "is_best_seller",
        "brand",
        "category",
        "subcategory",
    )
    list_editable = (
        "price",
        "sale_price",
        "gst_percentage",
        "stock_quantity",
        "is_published",
        "is_featured",
        "is_best_seller",
    )
    search_fields = ("name", "sku", "slug", "brand__name", "category__name")
    autocomplete_fields = ("brand", "category", "subcategory")
    prepopulated_fields = {"slug": ("name",)}
    list_select_related = ("brand", "category", "subcategory")
    inlines = (ProductImageInline, ProductVariantInline)
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
    list_per_page = 50
    save_on_top = True
    actions = ("publish", "unpublish", "mark_featured", "mark_best_seller")
    fieldsets = (
        ("Product", {"fields": ("name", "slug", "sku")}),
        ("Classification", {"fields": ("brand", "category", "subcategory")}),
        ("Pricing & tax", {"fields": ("price", "sale_price", "gst_percentage")}),
        ("Inventory", {"fields": ("stock_quantity",)}),
        ("Copy", {"fields": ("short_description", "description")}),
        (
            "Visibility",
            {"fields": ("is_published", "is_featured", "is_best_seller")},
        ),
    )

    @admin.action(description="Publish selected products")
    def publish(self, request, queryset):
        queryset.update(is_published=True)

    @admin.action(description="Unpublish selected products")
    def unpublish(self, request, queryset):
        queryset.update(is_published=False)

    @admin.action(description="Mark as featured")
    def mark_featured(self, request, queryset):
        queryset.update(is_featured=True)

    @admin.action(description="Mark as best seller")
    def mark_best_seller(self, request, queryset):
        queryset.update(is_best_seller=True)


@admin.register(InventoryItem)
class InventoryAdmin(admin.ModelAdmin):
    list_display = (
        "sku",
        "name",
        "brand",
        "stock_quantity",
        "stock_status",
        "is_published",
        "updated_at",
    )
    list_editable = ("stock_quantity", "is_published")
    list_filter = ("is_published", "brand", "category")
    search_fields = ("name", "sku", "brand__name")
    list_select_related = ("brand", "category")
    ordering = ("stock_quantity", "name")
    list_per_page = 75
    actions = ("mark_out_of_stock",)

    def has_add_permission(self, request):
        return False

    @admin.display(description="Stock", ordering="stock_quantity")
    def stock_status(self, obj: InventoryItem) -> str:
        if obj.stock_quantity == 0:
            color, label = "#b91c1c", "Out of stock"
        elif obj.stock_quantity <= 5:
            color, label = "#b45309", "Low"
        else:
            color, label = "#15803d", "In stock"
        return format_html('<span style="color:{};font-weight:600;">{}</span>', color, label)

    @admin.action(description="Set stock to 0")
    def mark_out_of_stock(self, request, queryset):
        queryset.update(stock_quantity=0)


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("preview", "product", "is_primary", "sort_order", "url")
    list_filter = ("is_primary", "product__category")
    list_editable = ("is_primary", "sort_order")
    search_fields = ("product__name", "product__sku", "alt_text", "url")
    autocomplete_fields = ("product",)
    list_select_related = ("product",)
    ordering = ("product__name", "sort_order")
    fields = ("product", "image", "url", "storage_key", "alt_text", "sort_order", "is_primary")
    readonly_fields = ("storage_key",)

    @admin.display(description="Preview")
    def preview(self, obj: ProductImage) -> str:
        return image_preview(obj.image.url if obj.image else obj.url, obj.alt_text)


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("name", "product", "sku", "price", "stock_quantity", "is_active")
    list_filter = ("is_active", "product__brand")
    list_editable = ("stock_quantity", "is_active")
    search_fields = ("name", "sku", "product__name", "product__sku")
    autocomplete_fields = ("product",)
    list_select_related = ("product",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "customer", "rating", "is_approved", "created_at")
    list_filter = ("is_approved", "rating", "created_at")
    list_editable = ("is_approved",)
    search_fields = ("product__name", "customer__full_name", "customer__email", "comment")
    autocomplete_fields = ("product", "customer")
    list_select_related = ("product", "customer")
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
    actions = ("approve", "unapprove")
    readonly_fields = ("created_at", "updated_at")

    @admin.action(description="Approve selected reviews")
    def approve(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Hide selected reviews")
    def unapprove(self, request, queryset):
        queryset.update(is_approved=False)
