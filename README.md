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
- Product images go Browser → Frontend → Django API → S3-compatible object storage. PostgreSQL stores the public image URL, not the file.

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
Browser → Frontend → Django API → Object storage → Public image URL → PostgreSQL
```

Uploads are resized, converted to WebP, and stored in S3-compatible object storage. The API saves only the public URL (and storage key) in PostgreSQL. Production refuses to start without object-storage credentials so files are not left on the Render filesystem.

Local development can omit those variables and write to `MEDIA_ROOT` instead.

## Environment variables

See `frontend/.env.example` and `backend/.env.example`. Do not commit real secrets or production credentials.

## Deployment

- Frontend → Vercel. Set `VITE_API_BASE_URL` to the public Render API origin + `/api`.
- Backend → Render web service. Root directory: `backend`.
  - Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
  - Start command: `gunicorn main:app -c gunicorn.conf.py`
  - Set `DJANGO_SETTINGS_MODULE=config.settings.production`.
  - The process must bind `0.0.0.0:$PORT` (handled by `gunicorn.conf.py`). Do not use `uvicorn ... --host 127.0.0.1`.
- Database → Render PostgreSQL. Set `DATABASE_URL`.
- Images → S3-compatible object storage (Cloudflare R2, AWS S3, or MinIO). Set `OBJECT_STORAGE_ENDPOINT_URL`, `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY`, `OBJECT_STORAGE_BUCKET_NAME`, and `OBJECT_STORAGE_PUBLIC_BASE_URL`. Do not store uploaded product images on the Render disk. `R2_*` remains a fallback alias.
