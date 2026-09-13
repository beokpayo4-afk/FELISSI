from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from django.conf import settings


class ObjectStorageError(Exception):
    pass


class ObjectStorage(Protocol):
    def upload(self, key: str, body: bytes, content_type: str) -> str: ...

    def delete(self, key: str) -> None: ...

    def public_url(self, key: str) -> str: ...


@dataclass(frozen=True)
class ObjectStorageSettings:
    endpoint_url: str
    access_key_id: str
    secret_access_key: str
    bucket_name: str
    public_base_url: str
    region: str = "auto"

    @property
    def is_configured(self) -> bool:
        return all(
            (
                self.endpoint_url,
                self.access_key_id,
                self.secret_access_key,
                self.bucket_name,
                self.public_base_url,
            )
        )


def load_object_storage_settings() -> ObjectStorageSettings:
    return ObjectStorageSettings(
        endpoint_url=str(getattr(settings, "OBJECT_STORAGE_ENDPOINT_URL", "") or ""),
        access_key_id=str(getattr(settings, "OBJECT_STORAGE_ACCESS_KEY_ID", "") or ""),
        secret_access_key=str(getattr(settings, "OBJECT_STORAGE_SECRET_ACCESS_KEY", "") or ""),
        bucket_name=str(getattr(settings, "OBJECT_STORAGE_BUCKET_NAME", "") or ""),
        public_base_url=str(getattr(settings, "OBJECT_STORAGE_PUBLIC_BASE_URL", "") or "").rstrip("/"),
        region=str(getattr(settings, "OBJECT_STORAGE_REGION", "") or "auto"),
    )


class MemoryObjectStorage:
    def __init__(self, public_base_url: str = "https://images.voltcart.test"):
        self.public_base_url = public_base_url.rstrip("/")
        self.objects: dict[str, bytes] = {}
        self.content_types: dict[str, str] = {}

    def public_url(self, key: str) -> str:
        return f"{self.public_base_url}/{key.lstrip('/')}"

    def upload(self, key: str, body: bytes, content_type: str) -> str:
        self.objects[key] = body
        self.content_types[key] = content_type
        return self.public_url(key)

    def delete(self, key: str) -> None:
        self.objects.pop(key, None)
        self.content_types.pop(key, None)


class LocalObjectStorage:
    """Development-only fallback. Production must use S3-compatible storage."""

    def __init__(self, root: Path, public_base_url: str):
        self.root = root
        self.public_base_url = public_base_url.rstrip("/")

    def public_url(self, key: str) -> str:
        return f"{self.public_base_url}/{key.lstrip('/')}"

    def upload(self, key: str, body: bytes, content_type: str) -> str:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)
        return self.public_url(key)

    def delete(self, key: str) -> None:
        path = self.root / key
        if path.is_file():
            path.unlink()


class S3CompatibleStorage:
    def __init__(self, config: ObjectStorageSettings):
        import boto3
        from botocore.config import Config

        self.config = config
        self.client = boto3.client(
            "s3",
            endpoint_url=config.endpoint_url,
            aws_access_key_id=config.access_key_id,
            aws_secret_access_key=config.secret_access_key,
            region_name=config.region,
            config=Config(signature_version="s3v4"),
        )

    def public_url(self, key: str) -> str:
        return f"{self.config.public_base_url}/{key.lstrip('/')}"

    def upload(self, key: str, body: bytes, content_type: str) -> str:
        try:
            self.client.put_object(
                Bucket=self.config.bucket_name,
                Key=key,
                Body=body,
                ContentType=content_type,
                CacheControl="public, max-age=31536000, immutable",
            )
        except Exception as exc:  # noqa: BLE001
            raise ObjectStorageError("Could not upload the product image.") from exc
        return self.public_url(key)

    def delete(self, key: str) -> None:
        try:
            self.client.delete_object(Bucket=self.config.bucket_name, Key=key)
        except Exception as exc:  # noqa: BLE001
            raise ObjectStorageError("Could not delete the product image.") from exc


_storage: ObjectStorage | None = None


def build_object_storage() -> ObjectStorage:
    backend = str(getattr(settings, "OBJECT_STORAGE_BACKEND", "") or "").strip().lower()
    if backend == "memory":
        return MemoryObjectStorage()

    config = load_object_storage_settings()
    if backend == "s3" or config.is_configured:
        if not config.is_configured:
            raise ObjectStorageError("Object storage is not fully configured.")
        return S3CompatibleStorage(config)

    public_base = str(getattr(settings, "OBJECT_STORAGE_PUBLIC_BASE_URL", "") or "").rstrip("/")
    if public_base:
        return LocalObjectStorage(Path(settings.MEDIA_ROOT), public_base)

    media_url = str(settings.MEDIA_URL)
    if not media_url.startswith("http"):
        origin = str(getattr(settings, "API_PUBLIC_ORIGIN", "") or "http://127.0.0.1:8000").rstrip("/")
        media_url = f"{origin}/{media_url.lstrip('/')}"
    return LocalObjectStorage(Path(settings.MEDIA_ROOT), media_url.rstrip("/"))


def get_object_storage() -> ObjectStorage:
    global _storage
    if _storage is None:
        _storage = build_object_storage()
    return _storage


def reset_object_storage() -> None:
    global _storage
    _storage = None


def object_storage_configured() -> bool:
    return load_object_storage_settings().is_configured
