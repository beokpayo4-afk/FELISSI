from decimal import Decimal

from django.utils.html import format_html


def inr(amount: Decimal | int | float | None) -> str:
    if amount is None:
        return "—"
    return f"₹{Decimal(amount):,.2f}"


def image_preview(url: str | None, alt: str = "") -> str:
    if not url:
        return "—"
    return format_html(
        '<img src="{}" alt="{}" style="height:48px;width:48px;object-fit:cover;border-radius:6px;" />',
        url,
        alt,
    )
