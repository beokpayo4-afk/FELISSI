from dataclasses import dataclass, replace
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.catalog.models import Product, ProductVariant
from apps.core.constants import FREE_SHIPPING_MIN, STANDARD_SHIPPING_CHARGE
from apps.core.models import StoreSettings
from apps.core.pricing import gst_included_in, gst_on_exclusive, money
from apps.orders.models import Cart, CartItem, Coupon, DiscountType, Order, OrderItem, PaymentMethod


def get_or_create_cart(customer) -> Cart:
    cart, _ = Cart.objects.get_or_create(customer=customer)
    return cart


def unit_price(product: Product, variant: ProductVariant | None) -> Decimal:
    if variant is not None and variant.price is not None:
        return variant.price
    if product.sale_price is not None:
        return product.sale_price
    return product.price


def available_stock(product: Product, variant: ProductVariant | None) -> int:
    if variant is not None:
        return variant.stock_quantity
    return product.stock_quantity


def get_valid_coupon(code: str, subtotal: Decimal) -> Coupon:
    now = timezone.now()
    coupon = Coupon.objects.filter(code=code.strip().upper()).first()
    if coupon is None or not coupon.is_active:
        raise ValidationError({"code": "This coupon is not valid."})
    if coupon.valid_from > now or coupon.valid_to < now:
        raise ValidationError({"code": "This coupon is not currently active."})
    if subtotal < coupon.min_order_amount:
        raise ValidationError(
            {"code": f"Minimum order amount for this coupon is {coupon.min_order_amount}."}
        )
    return coupon


def coupon_discount(coupon: Coupon, subtotal: Decimal) -> Decimal:
    if coupon.discount_type == DiscountType.PERCENT:
        discount = money(subtotal * coupon.amount / Decimal("100"))
    else:
        discount = coupon.amount
    if discount > subtotal:
        return subtotal
    return discount


def shipping_charge_for(amount_after_discount: Decimal) -> Decimal:
    if amount_after_discount >= FREE_SHIPPING_MIN:
        return Decimal("0.00")
    return STANDARD_SHIPPING_CHARGE


def line_gst(taxable: Decimal, gst_percentage: Decimal, *, gst_inclusive: bool = False) -> Decimal:
    if gst_inclusive:
        return gst_included_in(taxable, gst_percentage)
    return gst_on_exclusive(taxable, gst_percentage)


@dataclass(frozen=True)
class PricedLine:
    product: Product
    variant: ProductVariant | None
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    cart_item_id: int | None = None
    gst_percentage: Decimal = Decimal("0.00")
    taxable_amount: Decimal = Decimal("0.00")
    gst_amount: Decimal = Decimal("0.00")


@dataclass(frozen=True)
class CartQuote:
    lines: list[PricedLine]
    item_count: int
    subtotal: Decimal
    discount: Decimal
    gst: Decimal
    shipping_charge: Decimal
    total: Decimal
    coupon_code: str | None
    coupon_error: str | None
    gst_inclusive: bool = False
    taxable_subtotal: Decimal = Decimal("0.00")


def validation_message(exc: ValidationError) -> str:
    detail = exc.detail
    if isinstance(detail, dict):
        value = next(iter(detail.values()), "Unable to apply this coupon.")
        if isinstance(value, (list, tuple)):
            return str(value[0])
        return str(value)
    if isinstance(detail, list) and detail:
        return str(detail[0])
    return str(detail)


def compute_quote(
    lines: list[PricedLine],
    coupon_code: str | None = None,
    *,
    strict_coupon: bool = False,
    gst_inclusive: bool | None = None,
) -> CartQuote:
    """Price a cart from server-side unit prices. Never accept client totals."""
    inclusive = StoreSettings.gst_inclusive() if gst_inclusive is None else gst_inclusive
    subtotal = sum((line.line_total for line in lines), Decimal("0.00"))
    coupon = None
    discount = Decimal("0.00")
    coupon_error = None
    normalized_code = coupon_code.strip().upper() if coupon_code else None

    if normalized_code:
        try:
            coupon = get_valid_coupon(normalized_code, subtotal)
            discount = coupon_discount(coupon, subtotal)
        except ValidationError as exc:
            if strict_coupon:
                raise
            coupon_error = validation_message(exc)
            normalized_code = None

    quoted: list[PricedLine] = []
    gst = Decimal("0.00")
    taxable_subtotal = Decimal("0.00")
    for line in lines:
        share = Decimal("0.00") if subtotal == 0 else (line.line_total / subtotal)
        net = money(line.line_total - (discount * share))
        rate = line.product.gst_percentage
        if inclusive:
            gst_amount = line_gst(net, rate, gst_inclusive=True)
            taxable = money(net - gst_amount)
        else:
            taxable = net
            gst_amount = line_gst(taxable, rate, gst_inclusive=False)
        gst += gst_amount
        taxable_subtotal += taxable
        quoted.append(
            replace(
                line,
                gst_percentage=rate,
                taxable_amount=taxable,
                gst_amount=gst_amount,
            )
        )

    amount_after_discount = subtotal - discount
    shipping = shipping_charge_for(amount_after_discount) if lines else Decimal("0.00")
    if inclusive:
        total = money(amount_after_discount + shipping)
    else:
        total = money(amount_after_discount + gst + shipping)

    return CartQuote(
        lines=quoted,
        item_count=sum(line.quantity for line in quoted),
        subtotal=subtotal,
        discount=discount,
        gst=gst,
        shipping_charge=shipping,
        total=total,
        coupon_code=coupon.code if coupon else None,
        coupon_error=coupon_error,
        gst_inclusive=inclusive,
        taxable_subtotal=taxable_subtotal,
    )


def price_line(product: Product, variant: ProductVariant | None, quantity: int, cart_item_id=None) -> PricedLine:
    price = unit_price(product, variant)
    return PricedLine(
        product=product,
        variant=variant,
        quantity=quantity,
        unit_price=price,
        line_total=money(price * quantity),
        cart_item_id=cart_item_id,
        gst_percentage=product.gst_percentage,
    )


def quote_cart_items(items, coupon_code: str | None = None, *, strict_coupon: bool = False) -> CartQuote:
    lines = []
    for item in items:
        product = item.product
        if not product.is_published:
            continue
        variant = item.variant
        if variant is not None and (not variant.is_active or variant.product_id != product.id):
            continue
        lines.append(price_line(product, variant, item.quantity, cart_item_id=item.id))
    return compute_quote(lines, coupon_code, strict_coupon=strict_coupon)


def quote_requested_items(raw_items: list[dict], coupon_code: str | None = None) -> CartQuote:
    product_ids = [item["product_id"] for item in raw_items]
    products = {
        product.id: product
        for product in Product.objects.filter(pk__in=product_ids, is_published=True).prefetch_related(
            "images", "brand", "category", "subcategory"
        )
    }
    variant_ids = [item["variant_id"] for item in raw_items if item.get("variant_id")]
    variants = {
        variant.id: variant
        for variant in ProductVariant.objects.filter(pk__in=variant_ids, is_active=True)
    }

    lines = []
    for item in raw_items:
        product = products.get(item["product_id"])
        if product is None:
            continue
        variant = None
        variant_id = item.get("variant_id")
        if variant_id:
            variant = variants.get(variant_id)
            if variant is None or variant.product_id != product.id:
                continue
        lines.append(price_line(product, variant, item["quantity"]))
    return compute_quote(lines, coupon_code)


def lock_and_price_order_items(items) -> list[PricedLine]:
    priced_lines = []
    for item in items:
        product = Product.objects.select_for_update().get(pk=item.product_id)
        variant = None
        if item.variant_id:
            variant = ProductVariant.objects.select_for_update().get(pk=item.variant_id)
            if not variant.is_active or variant.product_id != product.id:
                raise ValidationError({"detail": "A cart variant is no longer available."})
        if not product.is_published:
            raise ValidationError({"detail": f"{product.name} is no longer available."})
        if item.quantity > available_stock(product, variant):
            raise ValidationError({"detail": f"Not enough stock for {product.name}."})
        priced_lines.append(price_line(product, variant, item.quantity, cart_item_id=item.id))
    return priced_lines


@transaction.atomic
def add_cart_item(cart: Cart, product_id, variant_id, quantity: int) -> CartItem:
    product = Product.objects.select_for_update().filter(pk=product_id, is_published=True).first()
    if product is None:
        raise ValidationError({"product_id": "Product was not found."})

    variant = None
    if variant_id:
        variant = ProductVariant.objects.select_for_update().filter(
            pk=variant_id, product=product, is_active=True
        ).first()
        if variant is None:
            raise ValidationError({"variant_id": "Variant was not found for this product."})

    stock = available_stock(product, variant)
    existing = CartItem.objects.filter(cart=cart, product=product, variant=variant).first()
    new_qty = quantity + (existing.quantity if existing else 0)
    if new_qty > stock:
        raise ValidationError({"quantity": "Not enough stock for this item."})

    if existing:
        existing.quantity = new_qty
        existing.save(update_fields=["quantity"])
        return existing

    return CartItem.objects.create(
        cart=cart,
        product=product,
        variant=variant,
        quantity=quantity,
    )


@transaction.atomic
def update_cart_item(item: CartItem, quantity: int) -> CartItem:
    product = Product.objects.select_for_update().get(pk=item.product_id)
    variant = None
    if item.variant_id:
        variant = ProductVariant.objects.select_for_update().get(pk=item.variant_id)
    if quantity > available_stock(product, variant):
        raise ValidationError({"quantity": "Not enough stock for this item."})
    item.quantity = quantity
    item.save(update_fields=["quantity"])
    return item


@transaction.atomic
def create_order(
    *,
    customer,
    shipping_address,
    coupon_code: str | None,
    payment_method: str = PaymentMethod.COD,
    client_request_id: str | None = None,
) -> Order:
    request_id = (client_request_id or "").strip()
    if request_id:
        existing = (
            Order.objects.select_for_update()
            .filter(customer=customer, client_request_id=request_id)
            .first()
        )
        if existing:
            return existing

    if shipping_address.customer_id != customer.id:
        raise ValidationError({"shipping_address_id": "Address must belong to you."})

    if payment_method not in PaymentMethod.values:
        raise ValidationError({"payment_method": "Choose a valid payment method."})

    cart = Cart.objects.select_for_update().filter(customer=customer).first()
    # Lock cart_items only. select_related("variant") LEFT JOINs a nullable FK;
    # PostgreSQL rejects FOR UPDATE on the nullable side of an outer join.
    item_ids = list(
        CartItem.objects.select_for_update().filter(cart=cart).values_list("pk", flat=True)
    ) if cart else []
    items = list(
        CartItem.objects.select_related("product", "variant").filter(pk__in=item_ids)
    )
    if not items:
        raise ValidationError({"detail": "Your cart is empty."})

    priced_lines = lock_and_price_order_items(items)
    quote = compute_quote(priced_lines, coupon_code, strict_coupon=True)

    order = Order.objects.create(
        customer=customer,
        shipping_address=shipping_address,
        subtotal=quote.subtotal,
        discount=quote.discount,
        gst=quote.gst,
        shipping_charge=quote.shipping_charge,
        total=quote.total,
        gst_inclusive=quote.gst_inclusive,
        payment_method=payment_method,
        client_request_id=request_id,
    )

    for line in quote.lines:
        product = line.product
        variant = line.variant
        OrderItem.objects.create(
            order=order,
            product=product,
            variant=variant,
            product_name=product.name if variant is None else f"{product.name} — {variant.name}",
            sku=variant.sku if variant else product.sku,
            unit_price=line.unit_price,
            quantity=line.quantity,
            gst_percentage=line.gst_percentage,
            taxable_amount=line.taxable_amount,
            gst_amount=line.gst_amount,
        )
        if variant:
            ProductVariant.objects.filter(pk=variant.pk).update(
                stock_quantity=variant.stock_quantity - line.quantity
            )
        else:
            Product.objects.filter(pk=product.pk).update(
                stock_quantity=product.stock_quantity - line.quantity
            )

    if cart:
        cart.items.all().delete()

    return order
