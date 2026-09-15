"""Serve uploaded product images from disk, then PostgreSQL.

Render's filesystem is ephemeral and uploads are gitignored, so the image
bytes are also stored on ProductImage. file_content in the database.
"""

from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpRequest, HttpResponse, HttpResponseNotFound
from django.views.static import serve as static_serve


MISSING_UPLOAD = (
    "This image file is not on the server. Open the product in admin and upload "
    "the photo again. Use the URL Django saves (for example /uploads/products/abc123.webp) "
    "— do not replace the filename with <that-file> or <filename>."
)


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


def _bytes_from_database(relative: str) -> tuple[bytes, str] | None:
    from apps.catalog.models import ProductImage

    image = (
        ProductImage.objects.filter(storage_key=relative)
        .exclude(file_content__isnull=True)
        .only("file_content", "file_content_type")
        .first()
    )
    if image is None:
        image = (
            ProductImage.objects.filter(url=f"/uploads/{relative}")
            .exclude(file_content__isnull=True)
            .only("file_content", "file_content_type")
            .first()
        )
    if image is None or not image.file_content:
        return None
    content_type = (image.file_content_type or "").strip() or "image/webp"
    return bytes(image.file_content), content_type


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
    return HttpResponse(body, content_type=content_type)
