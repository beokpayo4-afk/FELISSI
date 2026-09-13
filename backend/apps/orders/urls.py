from django.urls import include, path
from rest_framework.routers import SimpleRouter

from apps.orders.views import (
    CartQuoteView,
    CartViewSet,
    OrderViewSet,
    PaymentConfigView,
    ValidateCouponView,
    WishlistViewSet,
)

router = SimpleRouter()
router.register("wishlist", WishlistViewSet, basename="wishlist")
router.register("orders", OrderViewSet, basename="order")

cart_list = CartViewSet.as_view({"get": "list", "delete": "clear"})
cart_items = CartViewSet.as_view({"post": "add_item"})
cart_item_detail = CartViewSet.as_view({"patch": "update_item", "delete": "remove_item"})

urlpatterns = [
    path("cart/", cart_list, name="cart"),
    path("cart/quote/", CartQuoteView.as_view(), name="cart-quote"),
    path("cart/items/", cart_items, name="cart-items"),
    path("cart/items/<int:item_id>/", cart_item_detail, name="cart-item-detail"),
    path("coupons/validate/", ValidateCouponView.as_view(), name="coupon-validate"),
    path("payments/config/", PaymentConfigView.as_view(), name="payment-config"),
    path("", include(router.urls)),
]
