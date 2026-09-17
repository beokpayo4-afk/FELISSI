from decimal import Decimal

from rest_framework import serializers

from apps.accounts.serializers import AddressSerializer
from apps.catalog.serializers import ProductListSerializer
from apps.orders.models import Cart, CartItem, Order, OrderItem, Wishlist
from apps.orders.services import CartQuote, unit_price


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    variant_id = serializers.IntegerField(read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True, allow_null=True)
    unit_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = (
            "id",
            "product",
            "variant_id",
            "variant_name",
            "quantity",
            "unit_price",
            "line_total",
        )

    def get_unit_price(self, obj: CartItem) -> str:
        return f"{unit_price(obj.product, obj.variant):.2f}"

    def get_line_total(self, obj: CartItem) -> str:
        return f"{(unit_price(obj.product, obj.variant) * obj.quantity):.2f}"


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    discount = serializers.SerializerMethodField()
    gst = serializers.SerializerMethodField()
    gst_inclusive = serializers.SerializerMethodField()
    taxable_subtotal = serializers.SerializerMethodField()
    shipping_charge = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    coupon_code = serializers.SerializerMethodField()
    coupon_error = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = (
            "id",
            "items",
            "item_count",
            "subtotal",
            "discount",
            "gst",
            "gst_inclusive",
            "taxable_subtotal",
            "shipping_charge",
            "total",
            "coupon_code",
            "coupon_error",
            "updated_at",
        )

    def _quote(self, obj: Cart) -> CartQuote:
        cached = getattr(self, "_quote_cache", None)
        if cached is None:
            from apps.orders.services import quote_cart_items

            self._quote_cache = quote_cart_items(obj.items.all(), self.context.get("coupon_code"))
        return self._quote_cache

    def get_item_count(self, obj: Cart) -> int:
        return self._quote(obj).item_count

    def get_subtotal(self, obj: Cart) -> str:
        return f"{self._quote(obj).subtotal:.2f}"

    def get_discount(self, obj: Cart) -> str:
        return f"{self._quote(obj).discount:.2f}"

    def get_gst(self, obj: Cart) -> str:
        return f"{self._quote(obj).gst:.2f}"

    def get_gst_inclusive(self, obj: Cart) -> bool:
        return self._quote(obj).gst_inclusive

    def get_taxable_subtotal(self, obj: Cart) -> str:
        return f"{self._quote(obj).taxable_subtotal:.2f}"

    def get_shipping_charge(self, obj: Cart) -> str:
        return f"{self._quote(obj).shipping_charge:.2f}"

    def get_total(self, obj: Cart) -> str:
        return f"{self._quote(obj).total:.2f}"

    def get_coupon_code(self, obj: Cart) -> str | None:
        return self._quote(obj).coupon_code

    def get_coupon_error(self, obj: Cart) -> str | None:
        return self._quote(obj).coupon_error


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ("id", "product", "created_at")


class AddWishlistSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product_name",
            "sku",
            "unit_price",
            "quantity",
            "gst_percentage",
            "taxable_amount",
            "gst_amount",
        )


class OrderListSerializer(serializers.ModelSerializer):
    taxable_subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "subtotal",
            "discount",
            "gst",
            "gst_inclusive",
            "taxable_subtotal",
            "shipping_charge",
            "total",
            "payment_method",
            "payment_status",
            "order_status",
            "created_at",
        )

    def get_taxable_subtotal(self, obj: Order) -> str:
        items = list(obj.items.all())
        total = sum((item.taxable_amount for item in items), Decimal("0.00"))
        if total == 0 and obj.gst:
            return f"{(obj.subtotal - obj.discount):.2f}"
        return f"{total:.2f}"


class OrderDetailSerializer(OrderListSerializer):
    shipping_address = AddressSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    payment = serializers.SerializerMethodField()

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + (
            "shipping_address",
            "items",
            "updated_at",
            "payment",
        )

    def get_payment(self, obj: Order) -> dict | None:
        if obj.payment_method != "online":
            return None
        from apps.orders.payments import start_online_payment

        return start_online_payment(obj)


class CreateOrderSerializer(serializers.Serializer):
    shipping_address_id = serializers.UUIDField()
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=40)
    payment_method = serializers.ChoiceField(
        choices=("cod", "online"),
        required=False,
        default="cod",
    )
    client_request_id = serializers.CharField(required=False, allow_blank=True, max_length=64)


class QuoteItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class LenientQuoteItemListSerializer(serializers.ListSerializer):
    """Drop malformed guest-cart lines instead of failing the whole quote."""

    def to_internal_value(self, data):
        if not isinstance(data, list):
            self.fail("not_a_list", input_type=type(data).__name__)
        cleaned = []
        for item in data:
            try:
                cleaned.append(self.child.run_validation(item))
            except serializers.ValidationError:
                continue
        return cleaned


class QuoteItemListField(QuoteItemSerializer):
    class Meta:
        list_serializer_class = LenientQuoteItemListSerializer


class CartQuoteRequestSerializer(serializers.Serializer):
    items = QuoteItemListField(many=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=40)


class QuoteLineSerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=True)
    product = ProductListSerializer()
    variant_id = serializers.IntegerField(allow_null=True)
    variant_name = serializers.CharField(allow_null=True)
    quantity = serializers.IntegerField()
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    gst_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    taxable_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    gst_amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class CartQuoteSerializer(serializers.Serializer):
    items = QuoteLineSerializer(many=True)
    item_count = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2)
    gst = serializers.DecimalField(max_digits=12, decimal_places=2)
    gst_inclusive = serializers.BooleanField()
    taxable_subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    shipping_charge = serializers.DecimalField(max_digits=12, decimal_places=2)
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    coupon_code = serializers.CharField(allow_null=True)
    coupon_error = serializers.CharField(allow_null=True)


class ValidateCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=40)
    items = QuoteItemSerializer(many=True, required=False)


def serialize_quote(quote: CartQuote) -> dict:
    payload = {
        "items": [
            {
                "id": line.cart_item_id,
                "product": line.product,
                "variant_id": line.variant.id if line.variant else None,
                "variant_name": line.variant.name if line.variant else None,
                "quantity": line.quantity,
                "unit_price": line.unit_price,
                "line_total": line.line_total,
                "gst_percentage": line.gst_percentage,
                "taxable_amount": line.taxable_amount,
                "gst_amount": line.gst_amount,
            }
            for line in quote.lines
        ],
        "item_count": quote.item_count,
        "subtotal": quote.subtotal,
        "discount": quote.discount,
        "gst": quote.gst,
        "gst_inclusive": quote.gst_inclusive,
        "taxable_subtotal": quote.taxable_subtotal,
        "shipping_charge": quote.shipping_charge,
        "total": quote.total,
        "coupon_code": quote.coupon_code,
        "coupon_error": quote.coupon_error,
    }
    return CartQuoteSerializer(payload).data


class PaymentMethodOptionSerializer(serializers.Serializer):
    id = serializers.CharField()
    label = serializers.CharField()
    available = serializers.BooleanField()
    ready = serializers.BooleanField()


class PaymentConfigSerializer(serializers.Serializer):
    provider = serializers.CharField()
    configured = serializers.BooleanField()
    collects_card_on_site = serializers.BooleanField()
    methods = PaymentMethodOptionSerializer(many=True)
    upi_vpa = serializers.CharField(required=False, allow_blank=True)
    upi_payee_name = serializers.CharField(required=False, allow_blank=True)
