from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    label = "core"
    verbose_name = "Core"

    def ready(self) -> None:
        from django.conf import settings

        # Ensure upload folders exist in local and production (Render) runtimes.
        if getattr(settings, "UPLOAD_STORAGE_BACKEND", "") == "memory":
            return
        try:
            from apps.core.object_storage import ensure_upload_directories

            ensure_upload_directories()
        except Exception:  # noqa: BLE001 — never block app boot on mkdir races
            pass
