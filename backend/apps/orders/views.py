from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Address
from apps.accounts.services import get_customer
from apps.catalog.models import Product
from apps.core.permissions import IsAuthenticatedCustomer
from apps.orders.models import CartItem, Order, PaymentMethod, Wishlist
from apps.orders.serializers import (
    AddCartItemSerializer,
    AddWishlistSerializer,
    CartQuoteRequestSerializer,
    CartSerializer,
    CreateOrderSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    PaymentConfigSerializer,
    UpdateCartItemSerializer,
    ValidateCouponSerializer,
    WishlistItemSerializer,
    serialize_quote,
)
from apps.core.pagination import StandardPagination
from apps.orders.payments import payment_settings
from apps.orders.services import (
    add_cart_item,
    create_order,
    get_or_create_cart,
    quote_cart_items,
    quote_requested_items,
    update_cart_item,
)


def _cart_response(cart, coupon_code=None):
    cart = (
        type(cart)
        .objects.select_related("customer")
        .prefetch_related(
            "items__product__brand",
            "items__product__category",
            "items__product__subcategory",
            "items__product__images",
            "items__variant",
        )
        .get(pk=cart.pk)
    )
    return CartSerializer(cart, context={"coupon_code": coupon_code}).data


def _request_coupon(request) -> str | None:
    return request.query_params.get("coupon") or request.data.get("coupon_code") or None


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedCustomer]
    serializer_class = CartSerializer

    def list(self, request):
        customer = get_customer(request.user)
        cart = get_or_create_cart(customer)
        return Response(_cart_response(cart, _request_coupon(request)))

    def clear(self, request, pk=None):
        customer = get_customer(request.user)
        cart = get_or_create_cart(customer)
        cart.items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], url_path="items")
    def add_item(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = get_customer(request.user)
        cart = get_or_create_cart(customer)
        add_cart_item(
            cart,
            serializer.validated_data["product_id"],
            serializer.validated_data.get("variant_id"),
            serializer.validated_data["quantity"],
        )
        return Response(_cart_response(cart, _request_coupon(request)), status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["patch"], url_path=r"items/(?P<item_id>[0-9]+)")
    def update_item(self, request, item_id=None):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = get_customer(request.user)
        cart = get_or_create_cart(customer)
        item = CartItem.objects.filter(pk=item_id, cart=cart).first()
        if item is None:
            raise NotFound("Cart item was not found.")
        update_cart_item(item, serializer.validated_data["quantity"])
        return Response(_cart_response(cart, _request_coupon(request)))

    @action(detail=False, methods=["delete"], url_path=r"items/(?P<item_id>[0-9]+)")
    def remove_item(self, request, item_id=None):
        customer = get_customer(request.user)
        cart = get_or_create_cart(customer)
        item = CartItem.objects.filter(pk=item_id, cart=cart).first()
        if item is None:
            raise NotFound("Cart item was not found.")
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedCustomer]
    serializer_class = WishlistItemSerializer
    lookup_value_regex = r"[0-9a-f-]+"

    def list(self, request):
        customer = get_customer(request.user)
        items = (
            Wishlist.objects.filter(customer=customer)
            .select_related("product__brand", "product__category", "product__subcategory")
            .prefetch_related("product__images")
        )
        return Response(WishlistItemSerializer(items, many=True).data)

    def create(self, request):
        serializer = AddWishlistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = get_customer(request.user)
        product = Product.objects.filter(
            pk=serializer.validated_data["product_id"],
            is_published=True,
        ).first()
        if product is None:
            raise ValidationError({"product_id": "Product was not found."})
        item, created = Wishlist.objects.get_or_create(customer=customer, product=product)
        return Response(
            WishlistItemSerializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def destroy(self, request, pk=None):
        customer = get_customer(request.user)
        deleted, _ = Wishlist.objects.filter(customer=customer, product_id=pk).delete()
        if not deleted:
            raise NotFound("Wishlist item was not found.")
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(responses=OrderListSerializer),
    retrieve=extend_schema(
        parameters=[
            OpenApiParameter(
                name="order_number",
                type=str,
                location=OpenApiParameter.PATH,
                description="Order number",
            )
        ],
        responses=OrderDetailSerializer,
    ),
    create=extend_schema(request=CreateOrderSerializer, responses=OrderDetailSerializer),
)
class OrderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedCustomer]
    serializer_class = OrderListSerializer
    queryset = Order.objects.all()
    lookup_field = "order_number"
    lookup_value_regex = r"[^/.]+"

    def list(self, request):
        customer = get_customer(request.user)
        queryset = Order.objects.filter(customer=customer)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = OrderListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None, order_number=None):
        customer = get_customer(request.user)
        lookup = order_number or pk
        order = (
            Order.objects.filter(customer=customer, order_number=lookup)
            .select_related("shipping_address")
            .prefetch_related("items")
            .first()
        )
        if order is None:
            raise NotFound("Order was not found.")
        return Response(OrderDetailSerializer(order).data)

    def create(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = get_customer(request.user)
        address = Address.objects.filter(
            pk=serializer.validated_data["shipping_address_id"],
            customer=customer,
        ).first()
        if address is None:
            raise ValidationError({"shipping_address_id": "Address was not found."})
        coupon_code = serializer.validated_data.get("coupon_code") or None
        payment_method = serializer.validated_data.get("payment_method") or PaymentMethod.COD
        client_request_id = (
            serializer.validated_data.get("client_request_id")
            or request.headers.get("Idempotency-Key")
            or ""
        )
        existed = bool(
            client_request_id
            and Order.objects.filter(customer=customer, client_request_id=client_request_id).exists()
        )
        order = create_order(
            customer=customer,
            shipping_address=address,
            coupon_code=coupon_code,
            payment_method=payment_method,
            client_request_id=client_request_id or None,
        )
        order = (
            Order.objects.select_related("shipping_address")
            .prefetch_related("items")
            .get(pk=order.pk)
        )
        payload = OrderDetailSerializer(order).data
        return Response(
            payload,
            status=status.HTTP_200_OK if existed else status.HTTP_201_CREATED,
        )


class PaymentConfigView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PaymentConfigSerializer

    @extend_schema(responses=PaymentConfigSerializer, auth=[])
    def get(self, request):
        return Response(payment_settings())


class CartQuoteView(APIView):
    permission_classes = [AllowAny]
    serializer_class = CartQuoteRequestSerializer

    def post(self, request):
        serializer = CartQuoteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quote = quote_requested_items(
            serializer.validated_data["items"],
            serializer.validated_data.get("coupon_code") or None,
        )
        return Response(serialize_quote(quote))


class ValidateCouponView(APIView):
    permission_classes = [AllowAny]
    serializer_class = ValidateCouponSerializer

    def post(self, request):
        serializer = ValidateCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]
        items = serializer.validated_data.get("items")
        if items:
            quote = quote_requested_items(items, code)
        elif request.user.is_authenticated:
            customer = get_customer(request.user)
            cart = get_or_create_cart(customer)
            cart_items = cart.items.select_related("product", "variant")
            quote = quote_cart_items(cart_items, code)
        else:
            raise ValidationError({"items": "Provide cart items to validate this coupon."})

        if quote.coupon_error or quote.coupon_code is None:
            raise ValidationError({"code": quote.coupon_error or "This coupon is not valid."})

        return Response(
            {
                "valid": True,
                "code": quote.coupon_code,
                "discount": f"{quote.discount:.2f}",
                "subtotal": f"{quote.subtotal:.2f}",
                "gst": f"{quote.gst:.2f}",
                "gst_inclusive": quote.gst_inclusive,
                "taxable_subtotal": f"{quote.taxable_subtotal:.2f}",
                "shipping_charge": f"{quote.shipping_charge:.2f}",
                "total": f"{quote.total:.2f}",
            }
        )
