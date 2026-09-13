from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.catalog.models import Brand, Category, Product, SubCategory
from apps.core.models import StoreSettings
from apps.orders.services import compute_quote, price_line

User = get_user_model()


class GstQuoteTests(APITestCase):
    def setUp(self):
        StoreSettings.objects.update_or_create(pk=1, defaults={"gst_inclusive_pricing": False})
        self.category = Category.objects.create(name="Audio", slug="audio-gst")
        self.subcategory = SubCategory.objects.create(
            category=self.category, name="Cables", slug="cables-gst"
        )
        self.brand = Brand.objects.create(name="Nimbus", slug="nimbus-gst")
        self.exclusive = Product.objects.create(
            name="Clip 18",
            slug="clip-18",
            sku="GST-18",
            description="Clip",
            short_description="Clip",
            brand=self.brand,
            category=self.category,
            subcategory=self.subcategory,
            price=Decimal("100.00"),
            gst_percentage=Decimal("18.00"),
            stock_quantity=10,
            is_published=True,
        )
        self.twelve = Product.objects.create(
            name="Clip 12",
            slug="clip-12",
            sku="GST-12",
            description="Clip",
            short_description="Clip",
            brand=self.brand,
            category=self.category,
            subcategory=self.subcategory,
            price=Decimal("200.00"),
            gst_percentage=Decimal("12.00"),
            stock_quantity=10,
            is_published=True,
        )

    def test_exclusive_adds_gst_then_shipping(self):
        quote = compute_quote([price_line(self.exclusive, None, 1)], gst_inclusive=False)
        self.assertFalse(quote.gst_inclusive)
        self.assertEqual(quote.subtotal, Decimal("100.00"))
        self.assertEqual(quote.gst, Decimal("18.00"))
        self.assertEqual(quote.shipping_charge, Decimal("49.00"))
        self.assertEqual(quote.total, Decimal("167.00"))

    def test_inclusive_does_not_add_gst_again(self):
        self.exclusive.price = Decimal("118.00")
        self.exclusive.save(update_fields=["price"])
        quote = compute_quote([price_line(self.exclusive, None, 1)], gst_inclusive=True)
        self.assertTrue(quote.gst_inclusive)
        self.assertEqual(quote.subtotal, Decimal("118.00"))
        self.assertEqual(quote.gst, Decimal("18.00"))
        self.assertEqual(quote.taxable_subtotal, Decimal("100.00"))
        self.assertEqual(quote.shipping_charge, Decimal("49.00"))
        self.assertEqual(quote.total, Decimal("167.00"))

    def test_mixed_product_gst_rates(self):
        quote = compute_quote(
            [price_line(self.exclusive, None, 1), price_line(self.twelve, None, 1)],
            gst_inclusive=False,
        )
        self.assertEqual(quote.subtotal, Decimal("300.00"))
        self.assertEqual(quote.gst, Decimal("42.00"))
        self.assertEqual(quote.total, Decimal("391.00"))

    def test_product_api_exposes_breakdown(self):
        response = self.client.get(f"/api/v1/products/{self.exclusive.slug}/")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(response.data["gst_inclusive"])
        self.assertEqual(response.data["gst_percentage"], "18.00")
        self.assertEqual(response.data["taxable_price"], "100.00")
        self.assertEqual(response.data["gst_amount"], "18.00")
        self.assertEqual(response.data["inclusive_price"], "118.00")

    def test_staff_can_switch_gst_mode(self):
        User.objects.create_superuser(
            username="gst-admin",
            email="gst@voltcart.test",
            password="AdminPass12",
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "gst@voltcart.test", "password": "AdminPass12"},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login.data['token']}")
        updated = self.client.patch(
            "/api/v1/staff/settings/",
            {"gst_inclusive_pricing": True},
            format="json",
        )
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertTrue(updated.data["gst_inclusive_pricing"])
        public = self.client.get("/api/v1/store/settings/")
        self.assertEqual(public.status_code, 200)
        self.assertTrue(public.data["gst_inclusive_pricing"])
