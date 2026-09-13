from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import StoreSettings


@api_view(["GET"])
@permission_classes([AllowAny])
def health(_request: Request) -> Response:
    database_up = True
    try:
        connection.ensure_connection()
    except Exception:
        database_up = False

    payload = {
        "status": "ok" if database_up else "degraded",
        "service": "voltcart-api",
        "database": "up" if database_up else "down",
    }
    return Response(payload, status=200 if database_up else 503)


class PublicStoreSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings = StoreSettings.load()
        return Response(
            {
                "gst_inclusive_pricing": settings.gst_inclusive_pricing,
                "currency": "INR",
                "timezone": "Asia/Kolkata",
            }
        )
