from django_filters import rest_framework as filters

from apps.catalog.models import Product
from apps.staff.services import LOW_STOCK_THRESHOLD


class StaffProductFilter(filters.FilterSet):
    category = filters.NumberFilter(field_name="category_id")
    brand = filters.NumberFilter(field_name="brand_id")
    is_published = filters.BooleanFilter()
    is_featured = filters.BooleanFilter()
    is_best_seller = filters.BooleanFilter()
    stock = filters.CharFilter(method="filter_stock")

    class Meta:
        model = Product
        fields = ("category", "brand", "is_published", "is_featured", "is_best_seller")

    def filter_stock(self, queryset, _name, value: str):
        if value == "in":
            return queryset.filter(stock_quantity__gt=LOW_STOCK_THRESHOLD)
        if value == "low":
            return queryset.filter(stock_quantity__gte=1, stock_quantity__lte=LOW_STOCK_THRESHOLD)
        if value == "out":
            return queryset.filter(stock_quantity=0)
        return queryset
