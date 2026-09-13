# VoltCart

Production-oriented electronics e-commerce platform. The storefront sells electronics only. Branding, copy, and UI are original.

## Architecture

```text
eCommerce/
├── frontend/          React + Vite + TypeScript (Vercel)
└── backend/           Django + DRF + PostgreSQL (Render)
```

- Frontend talks to the API through `VITE_API_BASE_URL`. Never hard-code hostnames.
- Backend settings are split: `base`, `development`, `production`.
- Product images go Browser → Frontend → Django API → local `uploads/` folder. PostgreSQL stores the public path (e.g. `/uploads/products/<file>.webp`).

## Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL 15+ for staging/production (local development can use SQLite)

## Frontend

```bash
cd frontend
cp .env.example .env.development
npm install
npm run dev
```

The Vite app reads `.env.development` automatically. Required variable:

- `VITE_API_BASE_URL` — e.g. `http://127.0.0.1:8000/api`

## Backend

```bash
cd backend
python -m venv .venv
# Windows Git Bash
source .venv/Scripts/activate
# macOS / Linux
# source .venv/bin/activate

cp .env.example .env
# Set DJANGO_SECRET_KEY to a local random value

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# or: uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Health check: `http://127.0.0.1:8000/api/health/`

API docs: `http://127.0.0.1:8000/api/docs/`  
OpenAPI schema: `http://127.0.0.1:8000/api/schema/`

Authenticated routes expect `Authorization: Token <token>`.

## Product images

```text
Browser → Frontend → Django API → uploads/products/ → /uploads/products/<filename>
```

Uploads are validated (JPEG/PNG/WebP, max 8 MB), resized, converted to WebP, and saved under `backend/uploads/products/` with unique filenames. The API returns paths like `/uploads/products/<uuid>.webp`. Django serves those files in every environment.

Folder layout:

```text
uploads/
  products/
  categories/
  banners/
```

## Environment variables

See `frontend/.env.example` and `backend/.env.example`. Do not commit real secrets or production credentials.

Object-storage variables (`OBJECT_STORAGE_*`, `R2_*`) are **not** required and are unused.

## Deployment

- Frontend → Vercel. Set `VITE_API_BASE_URL` to the public Render API origin + `/api`.
- Backend → Render web service. **Root Directory:** `backend`.
  - **Build command:** `pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py collectstatic --noinput`
  - **Start command:** `gunicorn main:app -c gunicorn.conf.py`
  - Set `DJANGO_SETTINGS_MODULE=config.settings.production`.
  - Set `PYTHON_VERSION=3.12.8` (or rely on `backend/runtime.txt`). Do not use Python 3.14 — Django/psycopg pins here target 3.12.
  - The process must bind `0.0.0.0:$PORT` (handled by `gunicorn.conf.py`).
- Database → **Neon PostgreSQL**. Set `DATABASE_URL` in the Render Environment tab to your Neon connection string. Do not leave it empty.
- Images → local filesystem under `uploads/`, served at `/uploads/...`.
  - **Limitation:** Render’s default disk is ephemeral. Uploaded files disappear on redeploy/restart unless you attach a [persistent disk](https://render.com/docs/disks) mounted at the uploads directory.
  - Set `CORS_ALLOWED_ORIGINS` / `FRONTEND_ORIGIN` / `CSRF_TRUSTED_ORIGINS` to your Vercel origin (`https://...`).
