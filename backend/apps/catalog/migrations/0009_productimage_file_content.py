from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0008_productimage_storage_key"),
    ]

    operations = [
        migrations.AddField(
            model_name="productimage",
            name="file_content",
            field=models.BinaryField(blank=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name="productimage",
            name="file_content_type",
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AlterField(
            model_name="productimage",
            name="url",
            field=models.CharField(
                blank=True,
                help_text="Filled automatically after upload. Do not type a placeholder filename.",
                max_length=500,
            ),
        ),
    ]
