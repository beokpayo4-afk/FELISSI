"""Shared Django bootstrap helpers for local and Render environments."""

from __future__ import annotations

import os


def configure_settings_module() -> str:
    """Select the Django settings module for local vs Render.

    On Render, always use production settings so DEBUG stays False and
    production ALLOWED_HOSTS / security middleware apply — even if a local
    .env copied into the build tree still points at development.
    """
    if os.environ.get("RENDER"):
        os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.production"
        return os.environ["DJANGO_SETTINGS_MODULE"]

    existing = os.environ.get("DJANGO_SETTINGS_MODULE")
    if existing:
        return existing

    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.development"
    return os.environ["DJANGO_SETTINGS_MODULE"]


def env_int(name: str, default: int, *, minimum: int = 1) -> int:
    """Parse a positive integer env var, falling back on invalid values."""
    raw = os.environ.get(name)
    if raw is None or not str(raw).strip():
        return default
    try:
        value = int(str(raw).strip())
    except ValueError:
        return default
    if value < minimum:
        return default
    return value
