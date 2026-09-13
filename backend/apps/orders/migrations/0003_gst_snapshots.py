from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0002_order_payment_method"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="gst_inclusive",
            field=models.BooleanField(
                default=False,
                help_text="Snapshot of store GST mode when the order was placed.",
            ),
        ),
        migrations.AddField(
            model_name="orderitem",
            name="gst_percentage",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0.00"),
                max_digits=5,
                validators=[],
            ),
        ),
        migrations.AddField(
            model_name="orderitem",
            name="taxable_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0.00"),
                max_digits=12,
            ),
        ),
        migrations.AddField(
            model_name="orderitem",
            name="gst_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0.00"),
                max_digits=12,
            ),
        ),
    ]
