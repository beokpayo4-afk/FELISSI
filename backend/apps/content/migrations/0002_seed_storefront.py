from django.db import migrations


def seed_storefront(apps, _schema_editor):
    Banner = apps.get_model("content", "Banner")
    HomepageSection = apps.get_model("content", "HomepageSection")
    Category = apps.get_model("catalog", "Category")

    if not Banner.objects.exists():
        Banner.objects.bulk_create(
            [
                Banner(
                    placement="hero",
                    eyebrow="VoltCart marketplace",
                    title="Everyday electronics and home essentials, priced clearly",
                    subtitle="Audio, charging, storage, and kitchen tools in one clean storefront.",
                    button_label="Shop now",
                    button_url="/shop",
                    secondary_button_label="Featured picks",
                    secondary_button_url="/shop?featured=true",
                    is_active=True,
                    sort_order=0,
                ),
                Banner(
                    placement="promo",
                    eyebrow="This week",
                    title="Under ₹1,000 tech refresh",
                    subtitle="Cables, earbuds, hubs, and kitchen tools picked for everyday use.",
                    button_label="Shop the sale",
                    button_url="/shop",
                    is_active=True,
                    sort_order=1,
                ),
            ]
        )

    if HomepageSection.objects.exists():
        return

    audio = Category.objects.filter(slug="audio").first()
    kitchen = Category.objects.filter(slug="kitchen").first()
    HomepageSection.objects.bulk_create(
        [
            HomepageSection(
                section_type="featured_categories",
                eyebrow="Browse",
                title="Featured categories",
                action_label="View all",
                action_url="/shop",
                sort_order=0,
            ),
            HomepageSection(
                section_type="best_sellers",
                eyebrow="Most loved",
                title="Best sellers",
                action_label="View all",
                action_url="/shop?best_seller=true",
                sort_order=1,
            ),
            HomepageSection(
                section_type="new_arrivals",
                eyebrow="Just in",
                title="New arrivals",
                action_label="View all",
                action_url="/shop?ordering=-created_at",
                sort_order=2,
            ),
            HomepageSection(
                section_type="category",
                eyebrow="Electronics",
                title="Audio, power, and accessories",
                action_label="View all",
                action_url="/shop?category=audio",
                category=audio,
                sort_order=3,
            ),
            HomepageSection(
                section_type="category",
                eyebrow="Kitchen & home",
                title="Cook, serve, and store",
                action_label="View all",
                action_url="/shop?category=kitchen",
                category=kitchen,
                sort_order=4,
            ),
            HomepageSection(
                section_type="featured_products",
                eyebrow="Editor picks",
                title="Featured products",
                action_label="View all",
                action_url="/shop?featured=true",
                sort_order=5,
            ),
        ]
    )


def unseed_storefront(apps, _schema_editor):
    apps.get_model("content", "Banner").objects.all().delete()
    apps.get_model("content", "HomepageSection").objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0001_product_image_upload_and_storefront"),
        ("catalog", "0004_product_image_upload_and_storefront"),
    ]

    operations = [
        migrations.RunPython(seed_storefront, unseed_storefront),
    ]
