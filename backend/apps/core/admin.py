from django.contrib import admin

from apps.core.models import StoreSettings


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ("id", "gst_inclusive_pricing")
    fields = ("gst_inclusive_pricing",)

    def has_add_permission(self, request) -> bool:
        return not StoreSettings.objects.exists()

    def has_delete_permission(self, request, obj=None) -> bool:
        return False
