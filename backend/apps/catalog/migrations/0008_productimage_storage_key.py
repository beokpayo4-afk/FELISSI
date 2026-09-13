from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0007_delete_kitchen_category"),
    ]

    operations = [
        migrations.AddField(
            model_name="productimage",
            name="storage_key",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name="productimage",
            name="url",
            field=models.CharField(
                blank=True,
                help_text="Public object-storage URL stored in PostgreSQL.",
                max_length=500,
            ),
        ),
    ]
