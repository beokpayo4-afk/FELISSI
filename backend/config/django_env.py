"""Shared Django bootstrap helpers for local and Render environments."""

from __future__ import annotations

import os


def configure_settings_module() -> str:
    """Pick settings when DJANGO_SETTINGS_MODULE is unset.

    Render sets RENDER=true during build and runtime. Without an explicit
    settings module, prefer production there so collectstatic/migrate match
    the web process.
    """
    existing = os.environ.get("DJANGO_SETTINGS_MODULE")
    if existing:
        return existing

    module = (
        "config.settings.production"
        if os.environ.get("RENDER")
        else "config.settings.development"
    )
    os.environ["DJANGO_SETTINGS_MODULE"] = module
    return module


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
