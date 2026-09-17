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
        self.assertTrue(first.data["url"].startswith("/uploads/images/"))

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

    def test_uploaded_image_is_served_from_database(self):
        created = self.client.post(
            f"/api/v1/staff/products/{self.product.id}/images/",
            {"file": tiny_png("front.png"), "alt_text": "Front"},
            format="multipart",
        )
        self.assertEqual(created.status_code, 201, created.data)
        image = ProductImage.objects.get(pk=created.data["id"])
        self.assertTrue(image.file_content)
        response = self.client.get(created.data["url"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/webp")
        self.assertGreater(len(response.content), 32)

        legacy = self.client.get(image.url)
        self.assertEqual(legacy.status_code, 200)
        self.assertEqual(legacy.content, response.content)

    def test_image_is_served_when_storage_key_does_not_match_path(self):
        created = self.client.post(
            f"/api/v1/staff/products/{self.product.id}/images/",
            {"file": tiny_png("front.png"), "alt_text": "Front"},
            format="multipart",
        )
        self.assertEqual(created.status_code, 201, created.data)
        image = ProductImage.objects.get(pk=created.data["id"])
        stored_url = image.url
        image.storage_key = "products/missing-on-disk.webp"
        image.save(update_fields=["storage_key"])
        by_id = self.client.get(f"/uploads/images/{image.id}")
        self.assertEqual(by_id.status_code, 200, by_id.content[:200])
        by_url = self.client.get(stored_url)
        self.assertEqual(by_url.status_code, 200, by_url.content[:200])

    def test_serves_later_match_when_earlier_row_has_no_file_content(self):
        ProductImage.objects.create(
            product=self.product,
            url="/uploads/products/shared.webp",
            storage_key="products/shared.webp",
            file_content=None,
            alt_text="Empty",
            is_primary=True,
            sort_order=0,
        )
        payload = tiny_png("front.png").read()
        filled = ProductImage.objects.create(
            product=self.product,
            url="/uploads/products/shared.webp",
            storage_key="products/shared.webp",
            file_content=payload,
            file_content_type="image/png",
            alt_text="Filled",
            is_primary=False,
            sort_order=1,
        )
        response = self.client.get("/uploads/products/shared.webp")
        self.assertEqual(response.status_code, 200, response.content[:200])
        self.assertEqual(response.content, bytes(filled.file_content))

    def test_public_api_omits_unserveable_upload(self):
        ProductImage.objects.create(
            product=self.product,
            url="/uploads/products/missing.webp",
            storage_key="products/missing.webp",
            file_content=None,
            alt_text="Missing file",
            is_primary=True,
            sort_order=0,
        )
        detail = self.client.get(f"/api/v1/products/{self.product.slug}/")
        self.assertEqual(detail.status_code, 200, detail.data)
        self.assertIsNone(detail.data["primary_image"])
        self.assertEqual(detail.data["images"], [])
        listing = self.client.get("/api/v1/products/")
        self.assertEqual(listing.status_code, 200)
        match = next(item for item in listing.data["results"] if item["slug"] == self.product.slug)
        self.assertIsNone(match["primary_image"])

    def test_public_api_omits_catalog_standin_images(self):
        ProductImage.objects.create(
            product=self.product,
            url="/catalog/nimbus-air-buds.jpg",
            alt_text="Stand-in",
            is_primary=True,
            sort_order=0,
        )
        detail = self.client.get(f"/api/v1/products/{self.product.slug}/")
        self.assertEqual(detail.status_code, 200, detail.data)
        self.assertIsNone(detail.data["primary_image"])
        self.assertEqual(detail.data["images"], [])

    def test_placeholder_upload_path_is_not_a_debug_404(self):
        response = self.client.get("/uploads/products/%3Cthat-file%3E.webp")
        self.assertEqual(response.status_code, 404)
        self.assertIn(b"upload the photo again", response.content.lower())

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
