"""Local filesystem storage for product (and related) image uploads.

URLs are returned as site-relative paths: /uploads/products/<filename>
"""

from __future__ import annotations

from pathlib import Path
from typing import Protocol

from django.conf import settings


class ObjectStorageError(Exception):
    """Raised when an upload cannot be written or deleted."""


class ObjectStorage(Protocol):
    def upload(self, key: str, body: bytes, content_type: str) -> str: ...

    def delete(self, key: str) -> None: ...

    def public_url(self, key: str) -> str: ...


class MemoryObjectStorage:
    """In-memory backend for unit tests."""

    def __init__(self):
        self.objects: dict[str, bytes] = {}
        self.content_types: dict[str, str] = {}

    def public_url(self, key: str) -> str:
        return f"/uploads/{key.lstrip('/')}"

    def upload(self, key: str, body: bytes, content_type: str) -> str:
        normalized = key.lstrip("/")
        self.objects[normalized] = body
        self.content_types[normalized] = content_type
        return self.public_url(normalized)

    def delete(self, key: str) -> None:
        normalized = key.lstrip("/")
        self.objects.pop(normalized, None)
        self.content_types.pop(normalized, None)


class LocalFilesystemStorage:
    """Write uploads under UPLOADS_ROOT and serve them at MEDIA_URL."""

    def __init__(self, root: Path, url_prefix: str = "/uploads/"):
        self.root = Path(root)
        self.url_prefix = url_prefix if url_prefix.endswith("/") else f"{url_prefix}/"
        self.root.mkdir(parents=True, exist_ok=True)
        for subdir in getattr(settings, "UPLOAD_SUBDIRS", ("products", "categories", "banners")):
            (self.root / subdir).mkdir(parents=True, exist_ok=True)

    def public_url(self, key: str) -> str:
        return f"{self.url_prefix}{key.lstrip('/')}"

    def _safe_path(self, key: str) -> Path:
        normalized = key.replace("\\", "/").lstrip("/")
        parts = [part for part in normalized.split("/") if part]
        if not parts or any(part == ".." for part in parts):
            raise ObjectStorageError("Invalid storage key.")
        path = (self.root.joinpath(*parts)).resolve()
        root = self.root.resolve()
        if path != root and root not in path.parents:
            raise ObjectStorageError("Invalid storage key.")
        return path

    def upload(self, key: str, body: bytes, content_type: str) -> str:
        path = self._safe_path(key)
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(body)
        except OSError as exc:
            raise ObjectStorageError("Could not save the uploaded image.") from exc
        return self.public_url(key)

    def delete(self, key: str) -> None:
        if not (key or "").strip():
            return
        try:
            path = self._safe_path(key)
        except ObjectStorageError:
            return
        if path.is_file():
            try:
                path.unlink()
            except OSError as exc:
                raise ObjectStorageError("Could not delete the product image.") from exc


_storage: ObjectStorage | None = None


def ensure_upload_directories() -> Path:
    root = Path(getattr(settings, "UPLOADS_ROOT", settings.MEDIA_ROOT))
    root.mkdir(parents=True, exist_ok=True)
    for subdir in getattr(settings, "UPLOAD_SUBDIRS", ("products", "categories", "banners")):
        (root / subdir).mkdir(parents=True, exist_ok=True)
    return root


def build_object_storage() -> ObjectStorage:
    backend = str(getattr(settings, "UPLOAD_STORAGE_BACKEND", "") or "").strip().lower()
    if backend == "memory":
        return MemoryObjectStorage()

    root = ensure_upload_directories()
    url_prefix = str(getattr(settings, "MEDIA_URL", "/uploads/") or "/uploads/")
    if not url_prefix.startswith("/"):
        url_prefix = f"/{url_prefix}"
    return LocalFilesystemStorage(root, url_prefix)


def get_object_storage() -> ObjectStorage:
    global _storage
    if _storage is None:
        _storage = build_object_storage()
    return _storage


def reset_object_storage() -> None:
    global _storage
    _storage = None
