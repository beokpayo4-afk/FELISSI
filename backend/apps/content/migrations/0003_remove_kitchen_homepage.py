from django.db import migrations


def hide_kitchen_homepage(apps, _schema_editor):
    HomepageSection = apps.get_model("content", "HomepageSection")
    Banner = apps.get_model("content", "Banner")
    HomepageSection.objects.filter(action_url="/shop?category=kitchen").delete()
    Banner.objects.filter(subtitle__icontains="kitchen").update(
        subtitle="Cables, earbuds, hubs, and power accessories picked for everyday use."
    )
    Banner.objects.filter(title__icontains="home essentials").update(
        title="Everyday electronics, priced clearly",
        subtitle="Audio, charging, accessories, and storage in one clean storefront.",
    )


def noop(_apps, _schema_editor):
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0002_seed_storefront"),
        ("catalog", "0005_hide_removed_categories"),
    ]

    operations = [
        migrations.RunPython(hide_kitchen_homepage, noop),
    ]
