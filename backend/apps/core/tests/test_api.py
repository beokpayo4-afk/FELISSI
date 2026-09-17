from datetime import timedelta
from decimal import Decimal
from urllib.parse import urlparse

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.accounts.models import Address, Customer
from apps.catalog.models import Brand, Category, Product, ProductImage, Review, SubCategory
from apps.orders.models import Coupon, DiscountType, Order, OrderItem, OrderStatus, PaymentStatus, Wishlist

User = get_user_model()


class VoltCartAPITests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Audio", slug="audio")
        self.subcategory = SubCategory.objects.create(
            category=self.category, name="Headphones", slug="headphones"
        )
        self.brand = Brand.objects.create(name="Nimbus", slug="nimbus")
        self.product = Product.objects.create(
            name="Nimbus Air Buds",
            slug="nimbus-air-buds",
            sku="NB-AIR-1",
            description="Wireless earbuds with ANC.",
            short_description="Wireless earbuds",
            brand=self.brand,
            category=self.category,
            subcategory=self.subcategory,
            price=Decimal("1999.00"),
            sale_price=Decimal("1499.00"),
            stock_quantity=10,
            is_published=True,
            is_featured=True,
            is_best_seller=True,
        )
        ProductImage.objects.create(
            product=self.product,
            url="https://cdn.example.com/nimbus-air.jpg",
            alt_text="Nimbus Air Buds",
            is_primary=True,
        )
        self.draft = Product.objects.create(
            name="Hidden Draft",
            slug="hidden-draft",
            sku="DRAFT-1",
            description="Not public",
            short_description="Draft",
            brand=self.brand,
            category=self.category,
            subcategory=self.subcategory,
            price=Decimal("100.00"),
            stock_quantity=1,
            is_published=False,
        )
        now = timezone.now()
        self.coupon = Coupon.objects.create(
            code="SAVE10",
            discount_type=DiscountType.PERCENT,
            amount=Decimal("10.00"),
            min_order_amount=Decimal("500.00"),
            valid_from=now - timedelta(days=1),
            valid_to=now + timedelta(days=10),
        )

    def register(self, email="buyer@example.com"):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "full_name": "Riya Shah",
                "email": email,
                "phone": "9876543210",
                "password": "StrongPass1",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        return response.data

    def test_health(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")

    def test_register_login_me_logout(self):
        created = self.register()
        self.assertNotIn("password", created["customer"])
        me = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["email"], "buyer@example.com")

        self.client.credentials()
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "buyer@example.com", "password": "StrongPass1"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertFalse(login.data["is_staff"])
        self.assertNotIn("admin_url", login.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login.data['token']}")
        logout = self.client.post("/api/v1/auth/logout/")
        self.assertEqual(logout.status_code, 204)
        self.assertFalse(Token.objects.filter(user__email="buyer@example.com").exists())
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 401)

    def test_staff_login_creates_customer_profile(self):
        User.objects.create_superuser(
            username="Admin@admin123.com",
            email="Admin@admin123.com",
            password="Admin@1234",
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "Admin@admin123.com", "password": "Admin@1234"},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.assertEqual(login.data["customer"]["email"], "admin@admin123.com")
        self.assertTrue(login.data["is_staff"])
        self.assertTrue(login.data["customer"]["is_staff"])
        self.assertIn("/api/v1/auth/admin-session/", login.data["admin_url"])
        self.assertTrue(Customer.objects.filter(email="admin@admin123.com").exists())

        parsed = urlparse(login.data["admin_url"])
        handoff = self.client.get(f"{parsed.path}?{parsed.query}")
        self.assertEqual(handoff.status_code, 302)
        self.assertEqual(handoff["Location"], "/admin/")

        bad = self.client.get("/api/v1/auth/admin-session/?key=not-a-valid-key")
        self.assertEqual(bad.status_code, 302)
        self.assertIn("/admin/login/", bad["Location"])

    def test_update_profile_and_change_password(self):
        created = self.register()
        old_token = created["token"]
        updated = self.client.patch(
            "/api/v1/auth/me/",
            {"full_name": "Riya Shah Updated", "phone": "9876501234", "email": "hacker@example.com"},
            format="json",
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["full_name"], "Riya Shah Updated")
        self.assertEqual(updated.data["phone"], "9876501234")
        self.assertEqual(updated.data["email"], "buyer@example.com")

        changed = self.client.post(
            "/api/v1/auth/change-password/",
            {"current_password": "StrongPass1", "new_password": "EvenStronger2"},
            format="json",
        )
        self.assertEqual(changed.status_code, 200)
        self.assertIn("token", changed.data)
        self.assertNotEqual(changed.data["token"], old_token)
        self.assertFalse(Token.objects.filter(key=old_token).exists())

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {old_token}")
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 401)

        self.client.credentials()
        stale_login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "buyer@example.com", "password": "StrongPass1"},
            format="json",
        )
        self.assertEqual(stale_login.status_code, 400)
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "buyer@example.com", "password": "EvenStronger2"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)

    def test_password_reset_is_generic_and_confirms(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.core import mail
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        self.register()
        self.client.credentials()
        unknown = self.client.post(
            "/api/v1/auth/password-reset/",
            {"email": "missing@example.com"},
            format="json",
        )
        known = self.client.post(
            "/api/v1/auth/password-reset/",
            {"email": "buyer@example.com"},
            format="json",
        )
        self.assertEqual(unknown.status_code, 200)
        self.assertEqual(known.status_code, 200)
        self.assertEqual(unknown.data["detail"], known.data["detail"])
        self.assertNotIn("token", known.data)
        self.assertNotIn("uid", known.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/forgot-password?", mail.outbox[0].body)

        user = User.objects.get(email="buyer@example.com")
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        invalid = self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {"uid": uid, "token": "not-a-real-token", "new_password": "ResetPass9"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)
        confirmed = self.client.post(
            "/api/v1/auth/password-reset/confirm/",
            {"uid": uid, "token": token, "new_password": "ResetPass9"},
            format="json",
        )
        self.assertEqual(confirmed.status_code, 200)
        self.assertFalse(Token.objects.filter(user=user).exists())
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "buyer@example.com", "password": "ResetPass9"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)

    def test_address_update_and_delete(self):
        self.register()
        first = self.client.post(
            "/api/v1/addresses/",
            {
                "full_name": "Riya Shah",
                "phone": "9876543210",
                "line1": "12 Market Road",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001",
            },
            format="json",
        )
        self.assertEqual(first.status_code, 201)
        self.assertTrue(first.data["is_default"])
        second = self.client.post(
            "/api/v1/addresses/",
            {
                "full_name": "Riya Work",
                "phone": "9876543210",
                "line1": "88 Office Lane",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "is_default": True,
            },
            format="json",
        )
        self.assertEqual(second.status_code, 201)
        self.assertTrue(second.data["is_default"])
        refreshed_first = self.client.get(f"/api/v1/addresses/{first.data['id']}/")
        self.assertEqual(refreshed_first.status_code, 200)
        self.assertFalse(refreshed_first.data["is_default"])

        patched = self.client.patch(
            f"/api/v1/addresses/{first.data['id']}/",
            {"city": "Nagpur", "is_default": True},
            format="json",
        )
        self.assertEqual(patched.status_code, 200)
        self.assertEqual(patched.data["city"], "Nagpur")
        self.assertTrue(patched.data["is_default"])

        deleted = self.client.delete(f"/api/v1/addresses/{first.data['id']}/")
        self.assertEqual(deleted.status_code, 204)
        remaining = self.client.get("/api/v1/addresses/")
        self.assertEqual(len(remaining.data), 1)
        self.assertTrue(remaining.data[0]["is_default"])

    def test_register_rejects_duplicate_email(self):
        self.register()
        self.client.credentials()
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "full_name": "Other",
                "email": "buyer@example.com",
                "phone": "9999999999",
                "password": "StrongPass1",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_categories_and_subcategories(self):
        listing = self.client.get("/api/v1/categories/")
        self.assertEqual(listing.status_code, 200)
        slugs = [item["slug"] for item in listing.data["results"]]
        self.assertIn("audio", slugs)

        detail = self.client.get("/api/v1/categories/audio/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["subcategories"][0]["slug"], "headphones")

        nested = self.client.get("/api/v1/categories/audio/subcategories/")
        self.assertEqual(nested.status_code, 200)
        self.assertEqual(nested.data[0]["name"], "Headphones")

    def test_product_list_hides_drafts_and_supports_filters(self):
        listing = self.client.get("/api/v1/products/")
        slugs = [item["slug"] for item in listing.data["results"]]
        self.assertIn("nimbus-air-buds", slugs)
        self.assertNotIn("hidden-draft", slugs)

        search = self.client.get("/api/v1/products/?search=nimbus")
        self.assertEqual(search.data["count"], 1)

        filtered = self.client.get(
            "/api/v1/products/?category=audio&subcategory=headphones&brand=nimbus&min_price=1000&max_price=2000"
        )
        self.assertEqual(filtered.data["count"], 1)

        featured = self.client.get("/api/v1/products/featured/")
        self.assertEqual(featured.data["count"], 1)
        best = self.client.get("/api/v1/products/best-sellers/")
        self.assertEqual(best.data["count"], 1)
        latest = self.client.get("/api/v1/products/latest/")
        self.assertGreaterEqual(latest.data["count"], 1)

        detail = self.client.get("/api/v1/products/nimbus-air-buds/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["images"][0]["url"], "https://cdn.example.com/nimbus-air.jpg")
        self.assertEqual(self.client.get("/api/v1/products/hidden-draft/").status_code, 404)

        brands = self.client.get("/api/v1/brands/")
        self.assertEqual(brands.status_code, 200)
        self.assertEqual(brands.data[0]["slug"], "nimbus")

        rated = self.client.get("/api/v1/products/?ordering=-average_rating")
        self.assertEqual(rated.status_code, 200)
        self.assertIn("average_rating", rated.data["results"][0])
        self.assertIn("review_count", rated.data["results"][0])
        popular = self.client.get("/api/v1/products/?ordering=-popularity")
        self.assertEqual(popular.status_code, 200)

    def test_product_search_covers_sku_brand_category_and_suggestions(self):
        Product.objects.create(
            name="Harbor Bass One",
            slug="harbor-bass-one",
            sku="HB-BASS-1",
            description="Over-ear headphones.",
            short_description="Over-ear headphones",
            brand=Brand.objects.create(name="Harbor", slug="harbor"),
            category=self.category,
            subcategory=self.subcategory,
            price=Decimal("899.00"),
            sale_price=Decimal("699.00"),
            stock_quantity=5,
            is_published=True,
        )

        by_sku = self.client.get("/api/v1/products/?search=NB-AIR-1")
        self.assertEqual(by_sku.data["count"], 1)
        self.assertEqual(by_sku.data["results"][0]["sku"], "NB-AIR-1")

        by_brand = self.client.get("/api/v1/products/?search=harbor")
        self.assertEqual(by_brand.data["count"], 1)
        self.assertEqual(by_brand.data["results"][0]["slug"], "harbor-bass-one")

        by_category = self.client.get("/api/v1/products/?search=audio")
        self.assertEqual(by_category.data["count"], 2)

        missing = self.client.get("/api/v1/products/?search=no-such-product")
        self.assertEqual(missing.data["count"], 0)

        short = self.client.get("/api/v1/products/suggest/?q=n")
        self.assertEqual(short.data, {"products": [], "brands": [], "categories": []})

        suggestions = self.client.get("/api/v1/products/suggest/?q=nim")
        self.assertEqual(suggestions.status_code, 200)
        self.assertEqual(suggestions.data["products"][0]["slug"], "nimbus-air-buds")
        self.assertEqual(suggestions.data["brands"][0]["slug"], "nimbus")
        self.assertEqual(suggestions.data["categories"][0]["slug"], "audio")

        filtered = self.client.get(
            "/api/v1/products/?search=nimbus&category=audio&brand=nimbus&min_price=1000&max_price=2000"
        )
        self.assertEqual(filtered.data["count"], 1)

    def test_reviews(self):
        self.register()
        created = self.client.post(
            "/api/v1/products/nimbus-air-buds/reviews/",
            {"rating": 5, "comment": "Clear sound."},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        public = self.client.get("/api/v1/products/nimbus-air-buds/reviews/")
        self.assertEqual(public.data["count"], 0)
        Review.objects.filter(product=self.product).update(is_approved=True)
        public = self.client.get("/api/v1/products/nimbus-air-buds/reviews/")
        self.assertEqual(public.data["count"], 1)
        duplicate = self.client.post(
            "/api/v1/products/nimbus-air-buds/reviews/",
            {"rating": 4, "comment": "Again"},
            format="json",
        )
        self.assertEqual(duplicate.status_code, 400)

    def test_cart_wishlist_coupon_and_order(self):
        self.register()
        address = self.client.post(
            "/api/v1/addresses/",
            {
                "full_name": "Riya Shah",
                "phone": "9876543210",
                "line1": "12 Market Road",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001",
            },
            format="json",
        )
        self.assertEqual(address.status_code, 201)

        added = self.client.post(
            "/api/v1/cart/items/",
            {"product_id": str(self.product.id), "quantity": 2},
            format="json",
        )
        self.assertEqual(added.status_code, 201)
        item_id = added.data["items"][0]["id"]
        self.assertEqual(added.data["item_count"], 2)

        updated = self.client.patch(
            f"/api/v1/cart/items/{item_id}/",
            {"quantity": 1},
            format="json",
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["item_count"], 1)

        wish = self.client.post(
            "/api/v1/wishlist/",
            {"product_id": str(self.product.id)},
            format="json",
        )
        self.assertEqual(wish.status_code, 201)
        wishes = self.client.get("/api/v1/wishlist/")
        self.assertEqual(len(wishes.data), 1)
        removed = self.client.delete(f"/api/v1/wishlist/{self.product.id}/")
        self.assertEqual(removed.status_code, 204)

        coupon = self.client.post(
            "/api/v1/coupons/validate/",
            {"code": "SAVE10", "subtotal": "999999.00"},
            format="json",
        )
        self.assertEqual(coupon.status_code, 200)
        self.assertTrue(coupon.data["valid"])
        self.assertEqual(coupon.data["subtotal"], "1499.00")
        self.assertEqual(coupon.data["discount"], "149.90")

        cart = self.client.get("/api/v1/cart/?coupon=SAVE10")
        self.assertEqual(cart.status_code, 200)
        self.assertEqual(cart.data["subtotal"], "1499.00")
        self.assertEqual(cart.data["discount"], "149.90")
        self.assertEqual(cart.data["shipping_charge"], "0.00")
        self.assertIn("total", cart.data)
        self.assertIn("gst", cart.data)

        order = self.client.post(
            "/api/v1/orders/",
            {
                "shipping_address_id": address.data["id"],
                "coupon_code": "SAVE10",
            },
            format="json",
        )
        self.assertEqual(order.status_code, 201, order.data)
        self.assertEqual(order.data["discount"], "149.90")
        self.assertEqual(order.data["payment_method"], "cod")
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 9)

        listing = self.client.get("/api/v1/orders/")
        self.assertEqual(listing.data["count"], 1)
        detail = self.client.get(f"/api/v1/orders/{order.data['order_number']}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["items"][0]["sku"], "NB-AIR-1")

        cart = self.client.get("/api/v1/cart/")
        self.assertEqual(cart.data["item_count"], 0)

        self.client.post(
            "/api/v1/cart/items/",
            {"product_id": str(self.product.id), "quantity": 1},
            format="json",
        )
        cleared = self.client.delete("/api/v1/cart/")
        self.assertEqual(cleared.status_code, 204)

    def test_order_is_scoped_to_customer(self):
        first = self.register("one@example.com")
        Address.objects.create(
            customer=Customer.objects.get(email="one@example.com"),
            full_name="One",
            phone="1111111111",
            line1="A",
            city="Pune",
            state="MH",
            pincode="411001",
        )
        self.client.post(
            "/api/v1/cart/items/",
            {"product_id": str(self.product.id), "quantity": 1},
            format="json",
        )
        address = Address.objects.get(customer__email="one@example.com")
        order = self.client.post(
            "/api/v1/orders/",
            {"shipping_address_id": str(address.id)},
            format="json",
        )
        self.assertEqual(order.status_code, 201)
        order_number = order.data["order_number"]

        self.client.credentials()
        self.register("two@example.com")
        hidden = self.client.get(f"/api/v1/orders/{order_number}/")
        self.assertEqual(hidden.status_code, 404)
        self.assertEqual(self.client.get("/api/v1/orders/").data["count"], 0)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(first["customer"]["email"], "one@example.com")

    def test_unauthenticated_cart_is_rejected(self):
        response = self.client.get("/api/v1/cart/")
        self.assertEqual(response.status_code, 401)

    def test_guest_cart_quote_uses_server_prices(self):
        cheap = Product.objects.create(
            name="Cable Clip",
            slug="cable-clip",
            sku="CLIP-1",
            description="Desk cable clip.",
            short_description="Cable clip",
            brand=self.brand,
            category=self.category,
            subcategory=self.subcategory,
            price=Decimal("100.00"),
            stock_quantity=8,
            is_published=True,
        )
        quote = self.client.post(
            "/api/v1/cart/quote/",
            {
                "items": [
                    {
                        "product_id": str(cheap.id),
                        "quantity": 1,
                        "unit_price": "1.00",
                        "line_total": "1.00",
                    }
                ],
                "coupon_code": "SAVE10",
            },
            format="json",
        )
        self.assertEqual(quote.status_code, 200, quote.data)
        self.assertEqual(quote.data["subtotal"], "100.00")
        self.assertEqual(quote.data["discount"], "0.00")
        self.assertEqual(quote.data["gst"], "18.00")
        self.assertEqual(quote.data["shipping_charge"], "0.00")
        self.assertEqual(quote.data["total"], "118.00")
        self.assertIsNotNone(quote.data["coupon_error"])

        discounted = self.client.post(
            "/api/v1/cart/quote/",
            {
                "items": [{"product_id": str(self.product.id), "quantity": 1}],
                "coupon_code": "SAVE10",
            },
            format="json",
        )
        self.assertEqual(discounted.status_code, 200)
        self.assertEqual(discounted.data["subtotal"], "1499.00")
        self.assertEqual(discounted.data["discount"], "149.90")
        self.assertEqual(discounted.data["shipping_charge"], "0.00")
        self.assertEqual(discounted.data["total"], "1591.94")

    def test_address_validation_and_idempotent_checkout(self):
        self.register()
        invalid = self.client.post(
            "/api/v1/addresses/validate/",
            {
                "full_name": "A",
                "phone": "123",
                "line1": "x",
                "city": "P",
                "state": "",
                "pincode": "11",
            },
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)
        self.assertIn("pincode", invalid.data)
        self.assertIn("phone", invalid.data)

        address = self.client.post(
            "/api/v1/addresses/",
            {
                "full_name": "Riya Shah",
                "phone": "9876543210",
                "line1": "12 Market Road",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001",
            },
            format="json",
        )
        self.assertEqual(address.status_code, 201)
        valid = self.client.post(
            "/api/v1/addresses/validate/",
            {
                "full_name": "Riya Shah",
                "phone": "9876543210",
                "line1": "12 Market Road",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001",
            },
            format="json",
        )
        self.assertEqual(valid.status_code, 200)
        self.assertTrue(valid.data["valid"])

        config = self.client.get("/api/v1/payments/config/")
        self.assertEqual(config.status_code, 200)
        self.assertFalse(config.data["configured"])
        self.assertFalse(config.data["collects_card_on_site"])

        self.client.post(
            "/api/v1/cart/items/",
            {"product_id": str(self.product.id), "quantity": 1},
            format="json",
        )
        payload = {
            "shipping_address_id": address.data["id"],
            "payment_method": "online",
            "client_request_id": "checkout-repeat",
            "total": "1.00",
        }
        first = self.client.post("/api/v1/orders/", payload, format="json")
        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(first.data["total"], "1768.82")
        self.assertEqual(first.data["payment"]["status"], "not_configured")
        self.assertEqual(first.data["payment_method"], "online")

        second = self.client.post("/api/v1/orders/", payload, format="json")
        self.assertEqual(second.status_code, 200)
        self.assertEqual(second.data["order_number"], first.data["order_number"])
        self.assertEqual(Order.objects.count(), 1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 9)

    def test_schema_docs(self):
        schema = self.client.get("/api/schema/")
        self.assertEqual(schema.status_code, 200)
        docs = self.client.get("/api/docs/")
        self.assertEqual(docs.status_code, 200)

    def test_root_redirects_to_docs(self):
        response = self.client.get("/")
        self.assertRedirects(response, "/api/docs/", fetch_redirect_response=False)

    def test_api_root_redirects_to_docs(self):
        for url in ("/api", "/api/"):
            response = self.client.get(url)
            self.assertRedirects(response, "/api/docs/", fetch_redirect_response=False)

    def test_cors_allows_local_dev_origin(self):
        origin = "http://localhost:5173"
        response = self.client.options(
            "/api/v1/products/",
            HTTP_ORIGIN=origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), origin)

        checkout = self.client.options(
            "/api/v1/orders/",
            HTTP_ORIGIN=origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type,authorization,idempotency-key",
        )
        self.assertEqual(checkout.status_code, 200)
        self.assertEqual(checkout.headers.get("Access-Control-Allow-Origin"), origin)
        allowed = (checkout.headers.get("Access-Control-Allow-Headers") or "").lower()
        self.assertIn("idempotency-key", allowed)

    def test_staff_dashboard_and_catalog(self):
        guest = self.client.get("/api/v1/staff/dashboard/")
        self.assertEqual(guest.status_code, 401)

        self.register()
        buyer = self.client.get("/api/v1/staff/dashboard/")
        self.assertEqual(buyer.status_code, 403)

        User.objects.create_superuser(
            username="desk-admin",
            email="desk@voltcart.test",
            password="AdminPass12",
        )
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "desk@voltcart.test", "password": "AdminPass12"},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login.data['token']}")

        customer = Customer.objects.get(email="buyer@example.com")
        address = Address.objects.create(
            customer=customer,
            full_name="Riya Shah",
            phone="9876501234",
            line1="12 Lake Road",
            city="Raipur",
            state="Chhattisgarh",
            pincode="492001",
        )
        order = Order.objects.create(
            customer=customer,
            shipping_address=address,
            subtotal=Decimal("1999.00"),
            gst=Decimal("359.82"),
            total=Decimal("2358.82"),
            payment_status=PaymentStatus.PAID,
            order_status=OrderStatus.PENDING,
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            product_name=self.product.name,
            sku=self.product.sku,
            unit_price=Decimal("1499.00"),
            quantity=2,
            gst_percentage=Decimal("18.00"),
            taxable_amount=Decimal("2540.68"),
            gst_amount=Decimal("457.32"),
        )

        dashboard = self.client.get("/api/v1/staff/dashboard/")
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.data["totals"]["products"], 1)
        self.assertEqual(dashboard.data["totals"]["orders"], 1)
        self.assertEqual(dashboard.data["totals"]["customers"], Customer.objects.count())
        self.assertEqual(dashboard.data["paid_orders"], 1)
        self.assertEqual(dashboard.data["totals"]["revenue"], "2358.82")
        self.assertEqual(len(dashboard.data["sales"]), 14)

        products = self.client.get("/api/v1/staff/products/")
        self.assertEqual(products.status_code, 200)
        self.assertGreaterEqual(products.data["count"], 2)

        created = self.client.post(
            "/api/v1/staff/products/",
            {
                "name": "Desk Speaker",
                "sku": "DESK-SPK-1",
                "short_description": "Compact Bluetooth speaker",
                "description": "A compact speaker for the admin catalog.",
                "brand": self.brand.id,
                "category": self.category.id,
                "subcategory": self.subcategory.id,
                "price": "2499.00",
                "stock_quantity": 6,
                "is_published": True,
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        self.assertTrue(created.data["is_published"])
        self.assertEqual(created.data["sku"], "DESK-SPK-1")

        drafts = self.client.get("/api/v1/staff/products/?is_published=false")
        self.assertEqual(drafts.status_code, 200)
        self.assertTrue(any(item["sku"] == "DRAFT-1" for item in drafts.data["results"]))

        low_stock = self.client.get("/api/v1/staff/products/?stock=low")
        self.assertEqual(low_stock.status_code, 200)
        self.assertTrue(any(item["sku"] == "DRAFT-1" for item in low_stock.data["results"]))

        unpublished = self.client.patch(
            f"/api/v1/staff/products/{created.data['id']}/",
            {"is_published": False},
            format="json",
        )
        self.assertEqual(unpublished.status_code, 200, unpublished.data)
        self.assertFalse(unpublished.data["is_published"])

        removed = self.client.delete(f"/api/v1/staff/products/{created.data['id']}/")
        self.assertEqual(removed.status_code, 204)

        orders = self.client.get("/api/v1/staff/orders/")
        self.assertEqual(orders.status_code, 200)
        self.assertEqual(orders.data["count"], 1)
        number = orders.data["results"][0]["order_number"]
        self.assertEqual(orders.data["results"][0]["item_count"], 2)
        detail = self.client.get(f"/api/v1/staff/orders/{number}/")
        self.assertEqual(detail.status_code, 200, detail.data)
        self.assertEqual(detail.data["shipping_address"]["full_name"], "Riya Shah")
        self.assertEqual(detail.data["shipping_address"]["line1"], "12 Lake Road")
        self.assertEqual(detail.data["shipping_address"]["city"], "Raipur")
        self.assertEqual(detail.data["shipping_address"]["phone"], "9876501234")
        self.assertEqual(len(detail.data["items"]), 1)
        self.assertEqual(detail.data["items"][0]["product_name"], "Nimbus Air Buds")
        self.assertEqual(detail.data["items"][0]["quantity"], 2)
        self.assertEqual(detail.data["items"][0]["sku"], "NB-AIR-1")
        updated = self.client.patch(
            f"/api/v1/staff/orders/{number}/",
            {"order_status": "confirmed"},
            format="json",
        )
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(updated.data["order_status"], "confirmed")
        self.assertEqual(updated.data["items"][0]["quantity"], 2)
