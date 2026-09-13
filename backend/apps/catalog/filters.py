from django.db.models.functions import Coalesce
from django_filters import rest_framework as filters

from apps.catalog.models import Product
from apps.catalog.search import apply_product_search, rank_product_search


class ProductFilter(filters.FilterSet):
    search = filters.CharFilter(method="filter_search")
    category = filters.CharFilter(field_name="category__slug")
    subcategory = filters.CharFilter(field_name="subcategory__slug")
    brand = filters.CharFilter(field_name="brand__slug")
    min_price = filters.NumberFilter(method="filter_min_price")
    max_price = filters.NumberFilter(method="filter_max_price")
    featured = filters.BooleanFilter(field_name="is_featured")
    best_seller = filters.BooleanFilter(field_name="is_best_seller")

    class Meta:
        model = Product
        fields = (
            "search",
            "category",
            "subcategory",
            "brand",
            "min_price",
            "max_price",
            "featured",
            "best_seller",
        )

    def filter_search(self, queryset, _name, value):
        return rank_product_search(apply_product_search(queryset, value), value)

    def filter_min_price(self, queryset, _name, value):
        return queryset.annotate(
            _effective_price=Coalesce("sale_price", "price")
        ).filter(_effective_price__gte=value)

    def filter_max_price(self, queryset, _name, value):
        return queryset.annotate(
            _effective_price=Coalesce("sale_price", "price")
        ).filter(_effective_price__lte=value)
