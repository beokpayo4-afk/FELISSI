"""Shared Django bootstrap helpers for local and Render environments."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def ensure_project_interpreter() -> None:
    """Re-run manage.py with backend/.venv when another Python was used.

    System Python often has IPython but not this project's packages. Django 5.2
    then opens a shell with DJANGO_SETTINGS_MODULE set and apps not ready.
    """
    if os.environ.get("RENDER") or os.environ.get("CI"):
        return
    backend = Path(__file__).resolve().parent.parent
    venv_root = (backend / ".venv").resolve()
    if not venv_root.is_dir():
        return
    if Path(sys.prefix).resolve() == venv_root:
        return
    python = venv_root / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    if not python.is_file():
        return
    # Windows paths with spaces (e.g. C:\Users\Raj roshan\...) break os.execv.
    raise SystemExit(subprocess.run([str(python), *sys.argv]).returncode)


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
