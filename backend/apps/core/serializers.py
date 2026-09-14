from rest_framework import serializers


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()
    service = serializers.CharField()
    database = serializers.CharField()


class PublicStoreSettingsSerializer(serializers.Serializer):
    gst_inclusive_pricing = serializers.BooleanField()
    currency = serializers.CharField()
    timezone = serializers.CharField()
