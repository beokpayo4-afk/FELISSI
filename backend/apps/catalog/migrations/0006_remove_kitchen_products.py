from django.db import migrations


def remove_kitchen_products(apps, _schema_editor):
    Product = apps.get_model("catalog", "Product")
    Brand = apps.get_model("catalog", "Brand")
    Product.objects.filter(category__slug="kitchen").delete()
    Brand.objects.filter(slug__in=("hearth", "prepkit", "clearkeep")).update(is_active=False)


def noop(_apps, _schema_editor):
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0005_hide_removed_categories"),
    ]

    operations = [
        migrations.RunPython(remove_kitchen_products, noop),
    ]
