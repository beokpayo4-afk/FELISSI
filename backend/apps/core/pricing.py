from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

TWOPLACE = Decimal("0.01")
HUNDRED = Decimal("100")


def money(value: Decimal) -> Decimal:
    return value.quantize(TWOPLACE)


def gst_on_exclusive(taxable: Decimal, rate: Decimal) -> Decimal:
    if rate <= 0 or taxable <= 0:
        return Decimal("0.00")
    return money(taxable * rate / HUNDRED)


def gst_included_in(inclusive: Decimal, rate: Decimal) -> Decimal:
    if rate <= 0 or inclusive <= 0:
        return Decimal("0.00")
    return money(inclusive * rate / (HUNDRED + rate))


@dataclass(frozen=True)
class PriceBreakdown:
    catalog_price: Decimal
    gst_percentage: Decimal
    gst_inclusive: bool
    taxable_price: Decimal
    gst_amount: Decimal
    inclusive_price: Decimal


def break_down_price(
    catalog_price: Decimal,
    gst_percentage: Decimal,
    *,
    gst_inclusive: bool,
) -> PriceBreakdown:
    price = money(catalog_price)
    rate = gst_percentage
    if gst_inclusive:
        gst_amount = gst_included_in(price, rate)
        taxable = money(price - gst_amount)
        inclusive = price
    else:
        taxable = price
        gst_amount = gst_on_exclusive(price, rate)
        inclusive = money(taxable + gst_amount)
    return PriceBreakdown(
        catalog_price=price,
        gst_percentage=rate,
        gst_inclusive=gst_inclusive,
        taxable_price=taxable,
        gst_amount=gst_amount,
        inclusive_price=inclusive,
    )
