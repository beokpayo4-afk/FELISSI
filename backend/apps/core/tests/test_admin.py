from django.contrib.auth import get_user_model
from django.test import TestCase


class StoreAdminTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_superuser(
            username="store-admin",
            email="store-admin@example.com",
            password="AdminPass123",
        )
        self.client.force_login(self.admin)

    def test_management_pages_load(self):
        pages = (
            "/admin/",
            "/admin/catalog/product/",
            "/admin/catalog/product/add/",
            "/admin/catalog/category/",
            "/admin/catalog/subcategory/",
            "/admin/catalog/brand/",
            "/admin/catalog/productimage/",
            "/admin/catalog/inventoryitem/",
            "/admin/catalog/review/",
            "/admin/orders/order/",
            "/admin/orders/coupon/",
            "/admin/accounts/customer/",
            "/admin/content/banner/",
            "/admin/content/banner/add/",
            "/admin/content/homepagesection/",
            "/admin/content/homepagesection/add/",
        )
        for path in pages:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, path)
