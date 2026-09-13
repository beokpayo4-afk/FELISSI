from django.db.models import Prefetch, Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.services import get_customer
from apps.catalog.filters import ProductFilter
from apps.catalog.models import Brand, Category, Product, ProductVariant, Review, SubCategory
from apps.catalog.search import (
    MIN_SUGGEST_LENGTH,
    SUGGEST_FACET_LIMIT,
    SUGGEST_PRODUCT_LIMIT,
    annotate_product_listing,
    apply_product_search,
    normalize_search_query,
    rank_product_search,
)
from apps.catalog.serializers import (
    BrandSerializer,
    CategoryDetailSerializer,
    CategoryListSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ReviewCreateSerializer,
    ReviewSerializer,
    SearchProductSerializer,
    SubCategorySerializer,
)
from apps.core.permissions import IsAuthenticatedCustomer


class CategoryViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    search_fields = ("name", "slug")
    ordering_fields = ("name",)
    ordering = ("name",)

    def get_queryset(self):
        queryset = Category.objects.filter(is_active=True)
        if self.action == "retrieve":
            return queryset.prefetch_related(
                Prefetch(
                    "subcategories",
                    queryset=SubCategory.objects.filter(is_active=True),
                )
            )
        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CategoryDetailSerializer
        return CategoryListSerializer

    @action(detail=True, methods=["get"])
    def subcategories(self, request, slug=None):
        category = self.get_object()
        items = category.subcategories.filter(is_active=True)
        serializer = SubCategorySerializer(items, many=True)
        return Response(serializer.data)


class BrandViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    pagination_class = None
    serializer_class = BrandSerializer
    search_fields = ("name", "slug")
    ordering_fields = ("name",)
    ordering = ("name",)

    def get_queryset(self):
        return Brand.objects.filter(is_active=True)


class ProductViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_class = ProductFilter
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = (
        "created_at",
        "name",
        "effective_price",
        "average_rating",
        "review_count",
        "popularity",
        "search_rank",
    )
    ordering = ("-created_at",)

    def get_queryset(self):
        images = Prefetch("images")
        queryset = (
            Product.objects.filter(is_published=True)
            .select_related("brand", "category", "subcategory")
            .prefetch_related(images)
        )
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                Prefetch("variants", queryset=ProductVariant.objects.filter(is_active=True))
            )
        return queryset

    def filter_queryset(self, queryset):
        queryset = DjangoFilterBackend().filter_queryset(self.request, queryset, self)
        queryset = annotate_product_listing(queryset)
        if self.request.query_params.get("search") and not self.request.query_params.get("ordering"):
            return queryset.order_by("-search_rank", "-created_at")
        return OrderingFilter().filter_queryset(self.request, queryset, self)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        if self.action == "suggest":
            return SearchProductSerializer
        return ProductListSerializer

    @action(detail=False, methods=["get"], url_path="suggest")
    def suggest(self, request):
        query = normalize_search_query(request.query_params.get("q") or request.query_params.get("search"))
        if len(query) < MIN_SUGGEST_LENGTH:
            return Response({"products": [], "brands": [], "categories": []})

        products = list(
            rank_product_search(
                apply_product_search(self.get_queryset(), query),
                query,
            ).order_by("-search_rank", "name")[:SUGGEST_PRODUCT_LIMIT]
        )
        facet_q = Q(name__icontains=query) | Q(slug__icontains=query)
        if products:
            facet_q |= Q(pk__in={product.brand_id for product in products})
        brands = Brand.objects.filter(is_active=True).filter(facet_q).order_by("name")[:SUGGEST_FACET_LIMIT]
        category_q = Q(name__icontains=query) | Q(slug__icontains=query)
        if products:
            category_q |= Q(pk__in={product.category_id for product in products})
        categories = (
            Category.objects.filter(is_active=True).filter(category_q).order_by("name")[:SUGGEST_FACET_LIMIT]
        )
        return Response(
            {
                "products": SearchProductSerializer(products, many=True).data,
                "brands": BrandSerializer(brands, many=True).data,
                "categories": CategoryListSerializer(categories, many=True).data,
            }
        )

    @action(detail=False, methods=["get"])
    def featured(self, request):
        queryset = self.filter_queryset(self.get_queryset().filter(is_featured=True))
        return self._paginated(queryset)

    @action(detail=False, methods=["get"], url_path="best-sellers")
    def best_sellers(self, request):
        queryset = self.filter_queryset(self.get_queryset().filter(is_best_seller=True))
        return self._paginated(queryset)

    @action(detail=False, methods=["get"])
    def latest(self, request):
        queryset = self.filter_queryset(self.get_queryset().order_by("-created_at"))
        return self._paginated(queryset)

    @action(
        detail=True,
        methods=["get", "post"],
        permission_classes=[AllowAny],
    )
    def reviews(self, request, slug=None):
        product = self.get_object()
        if request.method == "GET":
            reviews = product.reviews.filter(is_approved=True).select_related("customer")
            page = self.paginate_queryset(reviews)
            serializer = ReviewSerializer(page or reviews, many=True)
            if page is not None:
                return self.get_paginated_response(serializer.data)
            return Response(serializer.data)

        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=401)
        if not IsAuthenticatedCustomer().has_permission(request, self):
            return Response({"detail": IsAuthenticatedCustomer.message}, status=403)

        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = get_customer(request.user)
        if Review.objects.filter(product=product, customer=customer).exists():
            return Response({"detail": "You have already reviewed this product."}, status=400)
        review = Review.objects.create(
            product=product,
            customer=customer,
            is_approved=False,
            **serializer.validated_data,
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    def _paginated(self, queryset):
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)
