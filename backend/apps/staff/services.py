from datetime import datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db.models import Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.accounts.models import Customer
from apps.catalog.models import Product, Review
from apps.orders.models import Order, OrderStatus, PaymentStatus

IST = ZoneInfo("Asia/Kolkata")
LOW_STOCK_THRESHOLD = 5


def _money(value) -> str:
    return f"{(value or Decimal('0.00')):.2f}"


def dashboard_payload() -> dict:
    now = timezone.now().astimezone(IST)
    today = now.date()
    window_start = today - timedelta(days=13)
    window_start_dt = timezone.make_aware(datetime.combine(window_start, time.min), IST)
    today_start = timezone.make_aware(datetime.combine(today, time.min), IST)
    paid = Q(payment_status=PaymentStatus.PAID)

    revenue = Order.objects.filter(paid).aggregate(total=Sum("total"))["total"]
    revenue_today = Order.objects.filter(paid, created_at__gte=today_start).aggregate(total=Sum("total"))[
        "total"
    ]
    daily_rows = (
        Order.objects.filter(paid, created_at__gte=window_start_dt)
        .annotate(day=TruncDate("created_at", tzinfo=IST))
        .values("day")
        .annotate(total=Sum("total"))
    )
    by_day = {row["day"]: row["total"] for row in daily_rows}
    sales = []
    for offset in range(14):
        day = window_start + timedelta(days=offset)
        sales.append({"date": day.isoformat(), "total": _money(by_day.get(day))})

    return {
        "generated_at": now.isoformat(),
        "timezone": "Asia/Kolkata",
        "totals": {
            "products": Product.objects.filter(is_published=True).count(),
            "products_all": Product.objects.count(),
            "orders": Order.objects.count(),
            "orders_pending": Order.objects.filter(order_status=OrderStatus.PENDING).count(),
            "customers": Customer.objects.count(),
            "revenue": _money(revenue),
            "revenue_today": _money(revenue_today),
        },
        "paid_orders": Order.objects.filter(paid).count(),
        "delivered": Order.objects.filter(order_status=OrderStatus.DELIVERED).count(),
        "low_stock": Product.objects.filter(
            is_published=True, stock_quantity__lte=LOW_STOCK_THRESHOLD
        ).count(),
        "pending_reviews": Review.objects.filter(is_approved=False).count(),
        "sales": sales,
        "order_mix": {
            "pending": Order.objects.filter(order_status=OrderStatus.PENDING).count(),
            "paid": Order.objects.filter(paid).count(),
            "delivered": Order.objects.filter(order_status=OrderStatus.DELIVERED).count(),
            "cancelled": Order.objects.filter(order_status=OrderStatus.CANCELLED).count(),
        },
    }
