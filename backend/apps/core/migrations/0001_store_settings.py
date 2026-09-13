from django.db import migrations, models


def create_store_settings(apps, schema_editor):
    StoreSettings = apps.get_model("core", "StoreSettings")
    StoreSettings.objects.get_or_create(pk=1, defaults={"gst_inclusive_pricing": False})


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="StoreSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "gst_inclusive_pricing",
                    models.BooleanField(
                        default=False,
                        help_text=(
                            "If enabled, catalog prices already include GST. If disabled, GST is added "
                            "on top of the catalog price at checkout."
                        ),
                    ),
                ),
            ],
            options={
                "verbose_name": "Store settings",
                "verbose_name_plural": "Store settings",
            },
        ),
        migrations.RunPython(create_store_settings, migrations.RunPython.noop),
    ]
