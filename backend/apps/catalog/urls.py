from rest_framework.routers import DefaultRouter

from apps.catalog.views import BrandViewSet, CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("brands", BrandViewSet, basename="brand")
router.register("products", ProductViewSet, basename="product")

urlpatterns = router.urls
