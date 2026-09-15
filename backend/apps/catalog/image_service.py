from __future__ import annotations

import uuid

from django.db import transaction

from apps.catalog.image_processing import optimize_product_image
from apps.catalog.models import Product, ProductImage
from apps.core.object_storage import ObjectStorageError, get_object_storage


def build_product_image_key(extension: str = "webp") -> str:
    """Flat unique key under uploads/products/."""
    safe_ext = (extension or "webp").lower().lstrip(".")
    return f"products/{uuid.uuid4().hex}.{safe_ext}"


def _set_primary(product: Product, image: ProductImage) -> None:
    ProductImage.objects.filter(product=product, is_primary=True).exclude(pk=image.pk).update(is_primary=False)
    if not image.is_primary:
        image.is_primary = True
        image.save(update_fields=["is_primary"])


@transaction.atomic
def store_uploaded_product_image(
    product: Product,
    uploaded,
    *,
    alt_text: str = "",
    is_primary: bool = False,
    sort_order: int | None = None,
) -> ProductImage:
    optimized = optimize_product_image(uploaded)
    key = build_product_image_key(optimized.extension)
    url = get_object_storage().upload(key, optimized.content, optimized.content_type)
    if sort_order is None:
        last = product.images.order_by("-sort_order").values_list("sort_order", flat=True).first()
        sort_order = 0 if last is None else last + 1
    make_primary = is_primary or not product.images.exists()
    image = ProductImage(
        product=product,
        url=url,
        storage_key=key,
        file_content=optimized.content,
        file_content_type=optimized.content_type,
        alt_text=(alt_text or product.name)[:160],
        sort_order=sort_order,
        is_primary=False,
    )
    image.save()
    _persist_file_bytes(image, optimized.content, optimized.content_type, key=key, url=url)
    if make_primary:
        _set_primary(product, image)
        image.refresh_from_db()
    return image


def delete_stored_image(image: ProductImage) -> None:
    was_primary = image.is_primary
    product = image.product
    image.delete()
    if was_primary:
        next_image = product.images.order_by("sort_order", "id").first()
        if next_image:
            _set_primary(product, next_image)


def add_remote_image_url(
    product: Product,
    url: str,
    *,
    alt_text: str = "",
    is_primary: bool = False,
) -> ProductImage:
    last = product.images.order_by("-sort_order").values_list("sort_order", flat=True).first()
    sort_order = 0 if last is None else last + 1
    make_primary = is_primary or not product.images.exists()
    image = ProductImage.objects.create(
        product=product,
        url=url.strip(),
        alt_text=(alt_text or product.name)[:160],
        sort_order=sort_order,
        is_primary=False,
    )
    if make_primary:
        _set_primary(product, image)
        image.refresh_from_db()
    return image


def update_stored_image(
    image: ProductImage,
    *,
    alt_text: str | None = None,
    is_primary: bool | None = None,
    sort_order: int | None = None,
) -> ProductImage:
    fields: list[str] = []
    if alt_text is not None:
        image.alt_text = alt_text[:160]
        fields.append("alt_text")
    if sort_order is not None:
        image.sort_order = sort_order
        fields.append("sort_order")
    if fields:
        image.save(update_fields=fields)
    if is_primary:
        _set_primary(image.product, image)
        image.refresh_from_db()
    return image


def persist_admin_upload(instance: ProductImage, uploaded) -> None:
    optimized = optimize_product_image(uploaded)
    previous = (instance.storage_key or "").strip()
    key = build_product_image_key(optimized.extension)
    instance.url = get_object_storage().upload(key, optimized.content, optimized.content_type)
    instance.storage_key = key
    instance.file_content = optimized.content
    instance.file_content_type = optimized.content_type
    instance.image = None
    if previous and previous != key:
        try:
            get_object_storage().delete(previous)
        except ObjectStorageError:
            pass


def _persist_file_bytes(
    image: ProductImage,
    content: bytes,
    content_type: str,
    *,
    key: str,
    url: str,
) -> None:
    """Force bytea onto the row. Model.save() can skip BinaryField on some backends."""
    if not image.pk or not content:
        return
    ProductImage.objects.filter(pk=image.pk).update(
        file_content=content,
        file_content_type=content_type,
        storage_key=key,
        url=url,
    )
    image.file_content = content
    image.file_content_type = content_type
    image.storage_key = key
    image.url = url
