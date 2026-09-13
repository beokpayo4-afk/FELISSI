from django.contrib import admin

from apps.core.admin_utils import image_preview

from .models import Banner, HomepageSection


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "placement",
        "preview",
        "is_active",
        "sort_order",
        "starts_at",
        "ends_at",
    )
    list_filter = ("placement", "is_active")
    list_editable = ("is_active", "sort_order")
    search_fields = ("title", "eyebrow", "subtitle", "button_label")
    ordering = ("sort_order", "title")
    date_hierarchy = "created_at"
    save_on_top = True
    fieldsets = (
        ("Placement", {"fields": ("placement", "is_active", "sort_order")}),
        ("Copy", {"fields": ("eyebrow", "title", "subtitle")}),
        ("Image", {"fields": ("image", "image_alt")}),
        (
            "Buttons",
            {
                "fields": (
                    "button_label",
                    "button_url",
                    "secondary_button_label",
                    "secondary_button_url",
                )
            },
        ),
        ("Schedule", {"fields": ("starts_at", "ends_at"), "classes": ("collapse",)}),
    )

    @admin.display(description="Preview")
    def preview(self, obj: Banner) -> str:
        return image_preview(obj.image.url if obj.image else "", obj.image_alt or obj.title)


@admin.register(HomepageSection)
class HomepageSectionAdmin(admin.ModelAdmin):
    list_display = ("title", "section_type", "category", "is_active", "sort_order")
    list_filter = ("section_type", "is_active", "category")
    list_editable = ("is_active", "sort_order")
    search_fields = ("title", "eyebrow", "action_label", "action_url")
    autocomplete_fields = ("category",)
    filter_horizontal = ("products",)
    ordering = ("sort_order", "title")
    list_select_related = ("category",)
    save_on_top = True
    fieldsets = (
        ("Section", {"fields": ("section_type", "is_active", "sort_order")}),
        ("Copy", {"fields": ("eyebrow", "title", "action_label", "action_url")}),
        ("Source", {"fields": ("category", "products")}),
    )
