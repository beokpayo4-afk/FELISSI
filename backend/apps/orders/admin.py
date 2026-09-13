from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html

from apps.core.admin_utils import inr

from .models import Cart, CartItem, Coupon, Order, OrderItem, Wishlist


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    autocomplete_fields = ("product", "variant")


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    autocomplete_fields = ("product", "variant")
    fields = (
        "product",
        "variant",
        "product_name",
        "sku",
        "unit_price",
        "quantity",
        "gst_percentage",
        "taxable_amount",
        "gst_amount",
        "line_total",
    )
    readonly_fields = ("line_total",)

    @admin.display(description="Line total")
    def line_total(self, obj: OrderItem) -> str:
        if not obj.pk:
            return "—"
        return inr(obj.unit_price * obj.quantity)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "updated_at")
    search_fields = ("customer__full_name", "customer__email")
    autocomplete_fields = ("customer",)
    list_select_related = ("customer",)
    inlines = (CartItemInline,)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "customer",
        "item_count",
        "subtotal_display",
        "gst_display",
        "discount_display",
        "shipping_display",
        "total_display",
        "payment_status",
        "order_status",
        "created_at",
    )
    list_filter = ("payment_method", "payment_status", "order_status", "created_at")
    list_editable = ("payment_status", "order_status")
    search_fields = (
        "order_number",
        "customer__full_name",
        "customer__email",
        "customer__phone",
    )
    autocomplete_fields = ("customer", "shipping_address")
    list_select_related = ("customer", "shipping_address")
    inlines = (OrderItemInline,)
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
    list_per_page = 50
    save_on_top = True
    readonly_fields = (
        "order_number",
        "subtotal",
        "discount",
        "gst",
        "gst_inclusive",
        "shipping_charge",
        "total",
        "shipping_address_display",
        "created_at",
        "updated_at",
    )
    fieldsets = (
        (
            "Order",
            {"fields": ("order_number", "customer", "created_at", "updated_at")},
        ),
        (
            "Status",
            {"fields": ("order_status", "payment_method", "payment_status")},
        ),
        (
            "Amounts",
            {"fields": ("subtotal", "discount", "gst", "gst_inclusive", "shipping_charge", "total")},
        ),
        (
            "Shipping",
            {"fields": ("shipping_address", "shipping_address_display")},
        ),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(_item_count=Count("items"))
            .prefetch_related("items")
        )

    @admin.display(description="Items", ordering="_item_count")
    def item_count(self, obj: Order) -> int:
        return obj._item_count

    @admin.display(description="Subtotal", ordering="subtotal")
    def subtotal_display(self, obj: Order) -> str:
        return inr(obj.subtotal)

    @admin.display(description="GST", ordering="gst")
    def gst_display(self, obj: Order) -> str:
        return inr(obj.gst)

    @admin.display(description="Discount", ordering="discount")
    def discount_display(self, obj: Order) -> str:
        return inr(obj.discount)

    @admin.display(description="Shipping", ordering="shipping_charge")
    def shipping_display(self, obj: Order) -> str:
        return inr(obj.shipping_charge)

    @admin.display(description="Total", ordering="total")
    def total_display(self, obj: Order) -> str:
        return inr(obj.total)

    @admin.display(description="Shipping address")
    def shipping_address_display(self, obj: Order) -> str:
        address = obj.shipping_address
        if not address:
            return "—"
        line2 = f"{address.line2}<br>" if address.line2 else ""
        return format_html(
            "{}<br>{}<br>{}{}, {} {}<br>{} · {}",
            address.full_name,
            address.line1,
            line2,
            address.city,
            address.state,
            address.pincode,
            address.phone,
            address.country,
        )


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "discount_type",
        "amount",
        "min_order_amount",
        "is_active",
        "valid_from",
        "valid_to",
    )
    list_filter = ("discount_type", "is_active", "valid_from", "valid_to")
    list_editable = ("is_active",)
    search_fields = ("code",)
    date_hierarchy = "valid_from"
    ordering = ("-created_at",)
    fieldsets = (
        (None, {"fields": ("code", "discount_type", "amount", "min_order_amount")}),
        ("Schedule", {"fields": ("is_active", "valid_from", "valid_to")}),
    )


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ("customer", "product", "created_at")
    search_fields = ("customer__full_name", "customer__email", "product__name", "product__sku")
    autocomplete_fields = ("customer", "product")
    list_select_related = ("customer", "product")
    date_hierarchy = "created_at"
