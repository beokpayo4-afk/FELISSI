from decimal import Decimal

from django.db.models import Avg, Case, Count, DecimalField, IntegerField, Q, Value, When
from django.db.models.functions import Coalesce

MAX_SEARCH_LENGTH = 80
MIN_SUGGEST_LENGTH = 2
SUGGEST_PRODUCT_LIMIT = 6
SUGGEST_FACET_LIMIT = 5


def normalize_search_query(value: str | None) -> str:
    return " ".join((value or "").split())[:MAX_SEARCH_LENGTH]


def search_terms(value: str | None) -> list[str]:
    query = normalize_search_query(value)
    if not query:
        return []
    return [term for term in query.split(" ") if term][:6]


def product_search_q(term: str) -> Q:
    return (
        Q(name__icontains=term)
        | Q(sku__icontains=term)
        | Q(brand__name__icontains=term)
        | Q(brand__slug__icontains=term)
        | Q(category__name__icontains=term)
        | Q(category__slug__icontains=term)
        | Q(subcategory__name__icontains=term)
        | Q(subcategory__slug__icontains=term)
    )


def looks_like_sku(term: str) -> bool:
    compact = term.replace("-", "")
    return "-" in term and bool(compact) and compact.isalnum()


def apply_product_search(queryset, value: str | None):
    terms = search_terms(value)
    if not terms:
        return queryset
    if len(terms) == 1 and looks_like_sku(terms[0]):
        term = terms[0]
        return queryset.filter(Q(sku__icontains=term) | Q(name__icontains=term))
    combined = Q()
    for term in terms:
        combined &= product_search_q(term)
    return queryset.filter(combined)


def rank_product_search(queryset, value: str | None):
    query = normalize_search_query(value)
    if not query:
        return queryset.annotate(search_rank=Value(0, output_field=IntegerField()))
    return queryset.annotate(
        search_rank=Case(
            When(sku__iexact=query, then=Value(100)),
            When(name__iexact=query, then=Value(90)),
            When(sku__istartswith=query, then=Value(80)),
            When(name__istartswith=query, then=Value(70)),
            When(brand__name__iexact=query, then=Value(60)),
            When(category__name__iexact=query, then=Value(50)),
            When(brand__name__istartswith=query, then=Value(40)),
            When(category__name__istartswith=query, then=Value(30)),
            default=Value(10),
            output_field=IntegerField(),
        )
    )


def annotate_product_listing(queryset):
    approved = Q(reviews__is_approved=True)
    return queryset.annotate(
        effective_price=Coalesce("sale_price", "price"),
        review_count=Count("reviews", filter=approved, distinct=True),
        average_rating=Coalesce(
            Avg("reviews__rating", filter=approved),
            Value(Decimal("0.00")),
            output_field=DecimalField(max_digits=3, decimal_places=2),
        ),
        popularity=Count("reviews", filter=approved, distinct=True)
        + Case(
            When(is_best_seller=True, then=Value(1000)),
            default=Value(0),
            output_field=IntegerField(),
        ),
    )
