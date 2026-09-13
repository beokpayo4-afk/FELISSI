from django.db import migrations


def delete_kitchen_category(apps, _schema_editor):
    Product = apps.get_model("catalog", "Product")
    SubCategory = apps.get_model("catalog", "SubCategory")
    Category = apps.get_model("catalog", "Category")
    Brand = apps.get_model("catalog", "Brand")
    Product.objects.filter(category__slug="kitchen").delete()
    SubCategory.objects.filter(category__slug="kitchen").delete()
    Category.objects.filter(slug="kitchen").delete()
    Brand.objects.filter(slug__in=("hearth", "prepkit", "clearkeep")).delete()


def noop(_apps, _schema_editor):
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0006_remove_kitchen_products"),
    ]

    operations = [
        migrations.RunPython(delete_kitchen_category, noop),
    ]
