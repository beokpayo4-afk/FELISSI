from rest_framework.permissions import BasePermission

from apps.accounts.models import Customer


class IsAuthenticatedCustomer(BasePermission):
    message = "A customer account is required."

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return Customer.objects.filter(user=user).exists()
