#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import os
import sys

from config.django_env import configure_settings_module, ensure_project_interpreter


def main() -> None:
    ensure_project_interpreter()
    configure_settings_module()
    try:
        from django.conf import settings
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. From backend/ run: source .venv/Scripts/activate"
        ) from exc
    try:
        settings.INSTALLED_APPS
    except Exception as exc:
        sys.stderr.write(
            "Django settings failed to load "
            f"({os.environ.get('DJANGO_SETTINGS_MODULE')}).\n{exc}\n"
        )
        raise SystemExit(1) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
