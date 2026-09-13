from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import PurePosixPath

from django.core.exceptions import ValidationError
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
MAX_EDGE = 1600
WEBP_QUALITY = 82

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
DANGEROUS_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".msi",
    ".scr",
    ".ps1",
    ".sh",
    ".php",
    ".phtml",
    ".asp",
    ".aspx",
    ".jsp",
    ".cgi",
    ".pl",
    ".py",
    ".js",
    ".mjs",
    ".html",
    ".htm",
    ".svg",
    ".xml",
    ".jar",
    ".dll",
    ".so",
    ".wasm",
}


@dataclass(frozen=True)
class OptimizedImage:
    content: bytes
    content_type: str
    extension: str


def _reject_dangerous_name(uploaded) -> None:
    name = (getattr(uploaded, "name", "") or "").strip()
    if not name:
        return
    suffix = PurePosixPath(name.replace("\\", "/")).suffix.lower()
    if suffix in DANGEROUS_EXTENSIONS:
        raise ValidationError("This file type is not allowed.")
    if suffix and suffix not in ALLOWED_EXTENSIONS:
        raise ValidationError("Upload a JPEG, PNG, or WebP image.")


def _reject_dangerous_content_type(uploaded) -> None:
    content_type = (getattr(uploaded, "content_type", "") or "").split(";")[0].strip().lower()
    if not content_type:
        return
    if content_type.startswith("application/") or content_type.startswith("text/"):
        raise ValidationError("This file type is not allowed.")
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError("Upload a JPEG, PNG, or WebP image.")


def optimize_product_image(uploaded) -> OptimizedImage:
    size = getattr(uploaded, "size", None)
    if size is not None and size <= 0:
        raise ValidationError("Uploaded file is empty.")
    if size and size > MAX_UPLOAD_BYTES:
        raise ValidationError("Image must be 8 MB or smaller.")

    _reject_dangerous_name(uploaded)
    _reject_dangerous_content_type(uploaded)

    uploaded.seek(0)
    try:
        image = Image.open(uploaded)
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValidationError("Upload a JPEG, PNG, or WebP image.") from exc

    fmt = (image.format or "").upper()
    if fmt == "JPG":
        fmt = "JPEG"
    if fmt not in ALLOWED_FORMATS:
        raise ValidationError("Upload a JPEG, PNG, or WebP image.")

    image = ImageOps.exif_transpose(image)
    if image.mode not in {"RGB", "RGBA"}:
        image = image.convert("RGBA") if "A" in image.getbands() else image.convert("RGB")
    image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)

    buffer = BytesIO()
    image.save(buffer, format="WEBP", quality=WEBP_QUALITY, method=6)
    return OptimizedImage(content=buffer.getvalue(), content_type="image/webp", extension="webp")
