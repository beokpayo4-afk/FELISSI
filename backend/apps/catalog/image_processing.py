from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

from django.core.exceptions import ValidationError
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
MAX_EDGE = 1600
WEBP_QUALITY = 82
ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP", "GIF"}


@dataclass(frozen=True)
class OptimizedImage:
    content: bytes
    content_type: str
    extension: str


def optimize_product_image(uploaded) -> OptimizedImage:
    size = getattr(uploaded, "size", None)
    if size and size > MAX_UPLOAD_BYTES:
        raise ValidationError("Image must be 8 MB or smaller.")

    uploaded.seek(0)
    try:
        image = Image.open(uploaded)
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValidationError("Upload a JPEG, PNG, WebP, or GIF image.") from exc

    fmt = (image.format or "").upper()
    if fmt == "JPG":
        fmt = "JPEG"
    if fmt not in ALLOWED_FORMATS:
        raise ValidationError("Upload a JPEG, PNG, WebP, or GIF image.")

    image = ImageOps.exif_transpose(image)
    if image.mode not in {"RGB", "RGBA"}:
        image = image.convert("RGBA") if "A" in image.getbands() else image.convert("RGB")
    image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)

    buffer = BytesIO()
    image.save(buffer, format="WEBP", quality=WEBP_QUALITY, method=6)
    return OptimizedImage(content=buffer.getvalue(), content_type="image/webp", extension="webp")
