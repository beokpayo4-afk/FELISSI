from django.contrib import admin
from django.db.models import Count

from .models import Address, Customer


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    fields = (
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


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "phone", "order_count", "created_at")
    list_filter = ("created_at",)
    search_fields = ("full_name", "email", "phone")
    autocomplete_fields = ("user",)
    inlines = (AddressInline,)
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
    list_per_page = 50
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("full_name", "email", "phone", "user")}),
        ("Record", {"fields": ("created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_order_count=Count("orders"))

    @admin.display(description="Orders", ordering="_order_count")
    def order_count(self, obj: Customer) -> int:
        return obj._order_count


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("full_name", "customer", "city", "state", "pincode", "is_default")
    list_filter = ("state", "is_default", "country")
    list_editable = ("is_default",)
    search_fields = ("full_name", "city", "pincode", "phone", "customer__email", "customer__full_name")
    autocomplete_fields = ("customer",)
    list_select_related = ("customer",)
    ordering = ("-is_default", "customer__full_name")
