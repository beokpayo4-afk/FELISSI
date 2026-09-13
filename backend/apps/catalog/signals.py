from django.db.models.signals import pre_delete
from django.dispatch import receiver

from apps.catalog.models import ProductImage
from apps.core.object_storage import ObjectStorageError, get_object_storage


@receiver(pre_delete, sender=ProductImage)
def remove_stored_product_image(sender, instance: ProductImage, **kwargs):
    key = (instance.storage_key or "").strip()
    if not key:
        return
    try:
        get_object_storage().delete(key)
    except ObjectStorageError:
        pass
