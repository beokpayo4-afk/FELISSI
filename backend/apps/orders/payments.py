from django.conf import settings


def payment_settings() -> dict:
    """Describe the payment integration without exposing secrets."""
    configured = bool(settings.PAYMENT_KEY_ID and settings.PAYMENT_KEY_SECRET)
    return {
        "provider": settings.PAYMENT_PROVIDER,
        "configured": configured,
        "collects_card_on_site": False,
        "methods": [
            {
                "id": "cod",
                "label": "Cash on delivery",
                "available": True,
                "ready": True,
            },
            {
                "id": "online",
                "label": "Online payment",
                "available": True,
                "ready": configured,
            },
        ],
    }


def start_online_payment(order) -> dict:
    """Reserve a gateway session. Credentials stay empty until a provider is connected."""
    config = payment_settings()
    if not config["configured"]:
        return {
            "status": "not_configured",
            "provider": config["provider"],
            "order_number": order.order_number,
            "message": (
                "Online payment is reserved but not connected. "
                "No charge was made and no card details were collected."
            ),
        }
    return {
        "status": "created",
        "provider": config["provider"],
        "order_number": order.order_number,
        "message": "A payment session would be created here.",
    }
