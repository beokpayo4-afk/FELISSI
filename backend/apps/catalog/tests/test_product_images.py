from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APITestCase

from apps.catalog.models import Brand, Category, Product, ProductImage, SubCategory
from apps.core.object_storage import get_object_storage, reset_object_storage

User = get_user_model()


def tiny_png(name="shot.png", color=(20, 80, 180)) -> SimpleUploadedFile:
    buffer = BytesIO()
    Image.new("RGB", (48, 48), color).save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


class ProductImageStorageTests(APITestCase):
    def setUp(self):
        reset_object_storage()
        self.category = Category.objects.create(name="Audio", slug="audio")
        self.subcategory = SubCategory.objects.create(
            category=self.category, name="Headphones", slug="headphones"
        )
        self.brand = Brand.objects.create(name="Nimbus", slug="nimbus")
        self.product = Product.objects.create(
            name="Nimbus Air Buds",
            slug="nimbus-air-buds",
            sku="NB-AIR-IMG",
            description="Wireless earbuds.",
            short_description="Wireless earbuds",
            brand=self.brand,
            category=self.category,
            subcategory=self.subcategory,
            price="1999.00",
            stock_quantity=10,
            is_published=True,
        )
        User.objects.create_superuser(
            username="img-admin",
            email="img@voltcart.test",
            password="AdminPass12",
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "img@voltcart.test", "password": "AdminPass12"},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login.data['token']}")

    def test_upload_multiple_images_and_delete(self):
        first = self.client.post(
            f"/api/v1/staff/products/{self.product.id}/images/",
            {"file": tiny_png("front.png"), "alt_text": "Front"},
            format="multipart",
        )
        self.assertEqual(first.status_code, 201, first.data)
        self.assertTrue(first.data["is_primary"])
        self.assertTrue(first.data["url"].startswith("https://images.voltcart.test/products/"))
        self.assertTrue(first.data["url"].endswith(".webp"))

        second = self.client.post(
            f"/api/v1/staff/products/{self.product.id}/images/",
            {"file": tiny_png("side.png", (200, 40, 40)), "alt_text": "Side"},
            format="multipart",
        )
        self.assertEqual(second.status_code, 201, second.data)
        self.assertFalse(second.data["is_primary"])

        listed = self.client.get(f"/api/v1/staff/products/{self.product.id}/images/")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data), 2)

        product = self.client.get(f"/api/v1/staff/products/{self.product.id}/")
        self.assertEqual(product.status_code, 200)
        self.assertEqual(len(product.data["images"]), 2)
        self.assertEqual(product.data["primary_image"]["id"], first.data["id"])

        storage = get_object_storage()
        self.assertEqual(len(storage.objects), 2)

        promoted = self.client.patch(
            f"/api/v1/staff/products/{self.product.id}/images/{second.data['id']}/",
            {"is_primary": True},
            format="json",
        )
        self.assertEqual(promoted.status_code, 200, promoted.data)
        self.assertTrue(promoted.data["is_primary"])

        removed = self.client.delete(
            f"/api/v1/staff/products/{self.product.id}/images/{second.data['id']}/"
        )
        self.assertEqual(removed.status_code, 204)
        self.assertEqual(ProductImage.objects.filter(product=self.product).count(), 1)
        remaining = ProductImage.objects.get(product=self.product)
        self.assertTrue(remaining.is_primary)
        self.assertEqual(len(storage.objects), 1)

    def test_remote_url_does_not_write_storage_key(self):
        created = self.client.post(
            f"/api/v1/staff/products/{self.product.id}/images/",
            {"url": "https://cdn.example.com/remote.webp", "alt_text": "Remote"},
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        image = ProductImage.objects.get(pk=created.data["id"])
        self.assertEqual(image.url, "https://cdn.example.com/remote.webp")
        self.assertEqual(image.storage_key, "")
        self.assertEqual(len(get_object_storage().objects), 0)
