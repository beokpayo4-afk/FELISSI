from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class StoreSettings(models.Model):
    gst_inclusive_pricing = models.BooleanField(
        default=False,
        help_text=(
            "If enabled, catalog prices already include GST. If disabled, GST is added "
            "on top of the catalog price at checkout."
        ),
    )

    class Meta:
        verbose_name = "Store settings"
        verbose_name_plural = "Store settings"

    def save(self, *args, **kwargs) -> None:
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs) -> tuple[int, dict[str, int]]:
        return 0, {}

    def __str__(self) -> str:
        return "Store settings"

    @classmethod
    def load(cls) -> "StoreSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    @classmethod
    def gst_inclusive(cls) -> bool:
        return bool(cls.load().gst_inclusive_pricing)
