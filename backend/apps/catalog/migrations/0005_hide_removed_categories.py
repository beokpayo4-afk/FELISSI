from django.db import migrations


REMOVED_SLUGS = ("wearables", "computing", "kitchen")


def hide_removed_categories(apps, _schema_editor):
    Category = apps.get_model("catalog", "Category")
    SubCategory = apps.get_model("catalog", "SubCategory")
    Product = apps.get_model("catalog", "Product")
    Category.objects.filter(slug__in=REMOVED_SLUGS).update(is_active=False)
    SubCategory.objects.filter(category__slug__in=REMOVED_SLUGS).update(is_active=False)
    Product.objects.filter(category__slug__in=REMOVED_SLUGS).update(is_published=False)


def show_removed_categories(apps, _schema_editor):
    Category = apps.get_model("catalog", "Category")
    SubCategory = apps.get_model("catalog", "SubCategory")
    Product = apps.get_model("catalog", "Product")
    Category.objects.filter(slug__in=REMOVED_SLUGS).update(is_active=True)
    SubCategory.objects.filter(category__slug__in=REMOVED_SLUGS).update(is_active=True)
    Product.objects.filter(category__slug__in=REMOVED_SLUGS).update(is_published=True)


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0004_product_image_upload_and_storefront"),
    ]

    operations = [
        migrations.RunPython(hide_removed_categories, show_removed_categories),
    ]
