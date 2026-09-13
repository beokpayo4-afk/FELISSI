from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="payment_method",
            field=models.CharField(
                choices=[("cod", "Cash on delivery"), ("online", "Online")],
                default="cod",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="client_request_id",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.UniqueConstraint(
                condition=models.Q(("client_request_id__gt", "")),
                fields=("customer", "client_request_id"),
                name="orders_unique_client_request_id",
            ),
        ),
    ]
