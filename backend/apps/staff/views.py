from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Prefetch, ProtectedError
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.catalog.image_service import (
    add_remote_image_url,
    delete_stored_image,
    store_uploaded_product_image,
    update_stored_image,
)
from apps.catalog.models import Brand, Category, Product, ProductImage, SubCategory
from apps.core.models import StoreSettings
from apps.core.object_storage import ObjectStorageError
from apps.orders.models import Order
from apps.staff.filters import StaffProductFilter
from apps.staff.permissions import IsStoreStaff
from apps.staff.serializers import (
    StaffBrandSerializer,
    StaffCategorySerializer,
    StaffDashboardSerializer,
    StaffOptionsSerializer,
    StaffOrderSerializer,
    StaffOrderUpdateSerializer,
    StaffProductImageSerializer,
    StaffProductImageUpdateSerializer,
    StaffProductImageWriteSerializer,
    StaffProductSerializer,
    StaffProductWriteSerializer,
    StaffStoreSettingsSerializer,
    StaffSubCategorySerializer,
)
from apps.staff.services import dashboard_payload


class StaffDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsStoreStaff]
    serializer_class = StaffDashboardSerializer

    @extend_schema(responses=StaffDashboardSerializer)
    def get(self, request):
        return Response(dashboard_payload())


class StaffOptionsView(APIView):
    permission_classes = [IsAuthenticated, IsStoreStaff]
    pagination_class = None
    serializer_class = StaffOptionsSerializer

    @extend_schema(responses=StaffOptionsSerializer)
    def get(self, request):
        return Response(
            {
                "brands": StaffBrandSerializer(
                    Brand.objects.filter(is_active=True).order_by("name"), many=True
                ).data,
                "categories": StaffCategorySerializer(
                    Category.objects.filter(is_active=True).order_by("name"), many=True
                ).data,
                "subcategories": StaffSubCategorySerializer(
                    SubCategory.objects.filter(is_active=True).select_related("category").order_by("name"),
                    many=True,
                ).data,
            }
        )


class StaffProductViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsStoreStaff]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_class = StaffProductFilter
    search_fields = ("name", "sku", "brand__name", "category__name")
    ordering_fields = ("created_at", "name", "price", "stock_quantity")
    ordering = ("-created_at",)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return (
            Product.objects.select_related("brand", "category", "subcategory")
            .prefetch_related(Prefetch("images", queryset=ProductImage.objects.order_by("sort_order", "id")))
            .all()
        )

    def get_serializer_class(self):
        if self.action in {"create", "partial_update"}:
            return StaffProductWriteSerializer
        return StaffProductSerializer

    def create(self, request, *args, **kwargs):
        writer = StaffProductWriteSerializer(data=request.data)
        writer.is_valid(raise_exception=True)
        product = writer.save()
        product = self.get_queryset().get(pk=product.pk)
        return Response(StaffProductSerializer(product).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        product = self.get_object()
        writer = StaffProductWriteSerializer(product, data=request.data, partial=True)
        writer.is_valid(raise_exception=True)
        writer.save()
        product = self.get_queryset().get(pk=product.pk)
        return Response(StaffProductSerializer(product).data)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        try:
            product.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": "This product is on existing orders, so it cannot be deleted. Unpublish it instead."
                },
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffProductImageListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsStoreStaff]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None
    serializer_class = StaffProductImageSerializer

    @extend_schema(responses=StaffProductImageSerializer(many=True))
    def get(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        images = product.images.order_by("sort_order", "id")
        return Response(StaffProductImageSerializer(images, many=True).data)

    @extend_schema(
        request=StaffProductImageWriteSerializer,
        responses={201: StaffProductImageSerializer},
    )
    def post(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        writer = StaffProductImageWriteSerializer(data=request.data)
        writer.is_valid(raise_exception=True)
        payload = writer.validated_data
        try:
            if payload.get("file"):
                image = store_uploaded_product_image(
                    product,
                    payload["file"],
                    alt_text=payload.get("alt_text", ""),
                    is_primary=payload.get("is_primary", False),
                )
            else:
                image = add_remote_image_url(
                    product,
                    payload["url"],
                    alt_text=payload.get("alt_text", ""),
                    is_primary=payload.get("is_primary", False),
                )
        except DjangoValidationError as exc:
            raise ValidationError({"file": exc.messages}) from exc
        except ObjectStorageError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(StaffProductImageSerializer(image).data, status=status.HTTP_201_CREATED)


class StaffProductImageDetailView(APIView):
    permission_classes = [IsAuthenticated, IsStoreStaff]
    parser_classes = [JSONParser]
    serializer_class = StaffProductImageSerializer

    def _get_image(self, product_id, image_id) -> ProductImage:
        return get_object_or_404(ProductImage, pk=image_id, product_id=product_id)

    @extend_schema(
        request=StaffProductImageUpdateSerializer,
        responses=StaffProductImageSerializer,
    )
    def patch(self, request, product_id, image_id):
        image = self._get_image(product_id, image_id)
        writer = StaffProductImageUpdateSerializer(data=request.data)
        writer.is_valid(raise_exception=True)
        image = update_stored_image(image, **writer.validated_data)
        return Response(StaffProductImageSerializer(image).data)

    @extend_schema(request=None, responses={204: None})
    def delete(self, request, product_id, image_id):
        image = self._get_image(product_id, image_id)
        try:
            delete_stored_image(image)
        except ObjectStorageError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffOrderViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsStoreStaff]
    serializer_class = StaffOrderSerializer
    search_fields = ("order_number", "customer__email", "customer__full_name")
    ordering_fields = ("created_at", "total")
    http_method_names = ["get", "patch", "head", "options"]
    lookup_field = "order_number"
    lookup_url_kwarg = "order_number"

    def get_queryset(self):
        return (
            Order.objects.select_related("customer")
            .annotate(item_count=Count("items"))
            .order_by("-created_at")
        )

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        serializer = StaffOrderUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(order, field, value)
        order.save(update_fields=[*serializer.validated_data.keys(), "updated_at"])
        order = self.get_queryset().get(pk=order.pk)
        return Response(StaffOrderSerializer(order).data)


class StaffStoreSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsStoreStaff]
    serializer_class = StaffStoreSettingsSerializer

    @extend_schema(responses=StaffStoreSettingsSerializer)
    def get(self, request):
        return Response(StaffStoreSettingsSerializer(StoreSettings.load()).data)

    @extend_schema(
        request=StaffStoreSettingsSerializer,
        responses=StaffStoreSettingsSerializer,
    )
    def patch(self, request):
        settings = StoreSettings.load()
        serializer = StaffStoreSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
