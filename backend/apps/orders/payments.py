from urllib.parse import urlencode

from django.conf import settings

from apps.core.company import LEGAL_NAME


def _upi_configured() -> bool:
    return bool((getattr(settings, "UPI_VPA", "") or "").strip())


def _gateway_configured() -> bool:
    return bool(settings.PAYMENT_KEY_ID and settings.PAYMENT_KEY_SECRET)


def payment_settings() -> dict:
    """Describe the payment integration without exposing secrets."""
    upi = _upi_configured()
    gateway = _gateway_configured()
    configured = upi or gateway
    provider = "upi" if upi else settings.PAYMENT_PROVIDER
    payload = {
        "provider": provider,
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
                "label": "UPI / Online payment" if upi else "Online payment",
                "available": True,
                "ready": configured,
            },
        ],
    }
    if upi:
        payload["upi_vpa"] = settings.UPI_VPA.strip()
        payload["upi_payee_name"] = (settings.UPI_PAYEE_NAME or LEGAL_NAME).strip() or LEGAL_NAME
    return payload


def build_upi_intent(order) -> dict:
    """Build a standard UPI deep-link the shopper can open in PhonePe / GPay / Paytm."""
    vpa = settings.UPI_VPA.strip()
    payee = (settings.UPI_PAYEE_NAME or LEGAL_NAME).strip() or LEGAL_NAME
    amount = f"{order.total:.2f}"
    note = f"Order {order.order_number}"
    query = urlencode(
        {
            "pa": vpa,
            "pn": payee,
            "am": amount,
            "cu": "INR",
            "tn": note,
        }
    )
    intent = f"upi://pay?{query}"
    return {
        "status": "upi_ready",
        "provider": "upi",
        "order_number": order.order_number,
        "upi_vpa": vpa,
        "upi_payee_name": payee,
        "amount": amount,
        "currency": "INR",
        "intent_url": intent,
        "message": (
            f"Pay ₹{amount} to {vpa} with any UPI app. "
            "After you pay, we will confirm the order."
        ),
    }


def start_online_payment(order) -> dict:
    """Start UPI pay (preferred) or reserve a gateway session."""
    if _upi_configured():
        return build_upi_intent(order)

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
