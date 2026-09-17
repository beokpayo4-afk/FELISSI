"""Serve uploaded product images from disk, then PostgreSQL.

Render's filesystem is ephemeral and uploads are gitignored, so the image
bytes are also stored on ProductImage.file_content in the database.
"""

from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.db.models import Q
from django.http import FileResponse, HttpRequest, HttpResponse, HttpResponseNotFound
from django.views.static import serve as static_serve


MISSING_UPLOAD = (
    "This image file is not on the server. Open the product in admin and upload "
    "the photo again. Use the URL Django saves (for example /uploads/products/abc123.webp) "
    "— do not replace the filename with <that-file> or <filename>."
)


def image_is_renderable(image) -> bool:
    """True when the storefront can actually display this image."""
    if getattr(image, "file_content", None):
        return True
    url = (getattr(image, "url", "") or "").strip()
    if not url:
        return False
    return url.startswith(("http://", "https://", "/placeholders/", "/brand/"))


def public_product_image_url(image) -> str:
    """Stable public path that is looked up by primary key."""
    url = (getattr(image, "url", "") or "").strip()
    if getattr(image, "pk", None) and getattr(image, "file_content", None):
        return f"/uploads/images/{image.pk}"
    return url


def _safe_relative_path(relative: str) -> str | None:
    normalized = (relative or "").replace("\\", "/").lstrip("/")
    if not normalized or normalized.startswith("/") or ":" in normalized:
        return None
    parts = [part for part in normalized.split("/") if part]
    if not parts or any(part == ".." for part in parts):
        return None
    return "/".join(parts)


def _media_file(relative: str) -> Path | None:
    root = Path(settings.MEDIA_ROOT).resolve()
    target = (root.joinpath(*relative.split("/"))).resolve()
    if target != root and root not in target.parents:
        return None
    return target


def _image_pk(relative: str) -> int | None:
    name = relative.rsplit("/", 1)[-1]
    stem = name.rsplit(".", 1)[0] if "." in name else name
    if stem.isdigit():
        return int(stem)
    return None


def _content_from_image(image) -> tuple[bytes, str] | None:
    if image is None:
        return None
    raw = image.file_content
    if not raw:
        return None
    body = bytes(raw)
    if not body:
        return None
    content_type = (image.file_content_type or "").strip() or "image/webp"
    return body, content_type


def _bytes_from_database(relative: str) -> tuple[bytes, str] | None:
    from apps.catalog.models import ProductImage

    # Do not use only()/defer() on BinaryField: PostgreSQL + psycopg3 can
    # return empty bytes for deferred bytea columns, which 404s real images.
    pk = _image_pk(relative) if relative.startswith("images/") else None
    if pk is not None:
        found = _content_from_image(ProductImage.objects.filter(pk=pk).first())
        if found:
            return found

    filename = relative.rsplit("/", 1)[-1]
    candidates = (
        ProductImage.objects.filter(
            Q(storage_key=relative)
            | Q(storage_key=filename)
            | Q(storage_key__endswith=f"/{filename}")
            | Q(url=f"/uploads/{relative}")
            | Q(url__endswith=f"/{filename}")
            | Q(url__endswith=relative)
        )
        .exclude(file_content__isnull=True)
        .order_by("id")
        .iterator()
    )
    for image in candidates:
        found = _content_from_image(image)
        if found:
            return found
    return None


def _image_response(body: bytes, content_type: str) -> HttpResponse:
    response = HttpResponse(body, content_type=content_type)
    response["Cache-Control"] = "public, max-age=86400"
    response["Content-Disposition"] = "inline"
    return response


def serve_upload(request: HttpRequest, path: str) -> HttpResponse:
    relative = _safe_relative_path(path)
    if relative is None:
        return HttpResponseNotFound(MISSING_UPLOAD)

    disk = _media_file(relative)
    if disk is not None and disk.is_file():
        return static_serve(request, relative, document_root=str(settings.MEDIA_ROOT))

    stored = _bytes_from_database(relative)
    if stored is None:
        return HttpResponseNotFound(MISSING_UPLOAD)

    body, content_type = stored
    backend = str(getattr(settings, "UPLOAD_STORAGE_BACKEND", "") or "").strip().lower()
    if backend != "memory" and disk is not None:
        try:
            disk.parent.mkdir(parents=True, exist_ok=True)
            disk.write_bytes(body)
            if disk.is_file():
                return FileResponse(disk.open("rb"), content_type=content_type)
        except OSError:
            pass
    return _image_response(body, content_type)
