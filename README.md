# Product Browser

FastAPI + MySQL product browser demonstrating stable cursor pagination over 200,000 products.

## Features

- 200,000 seeded products
- Category filtering
- Newest-first ordering
- Cursor pagination using `(created_at, id)`
- Opaque Base64 cursors
- Snapshot cursor to prevent duplicates and missing records while browsing
- Demo endpoint to insert 50 new products
- One-page React UI for testing pagination consistency

## Project Structure

```text
app/
  api/
    cursor.py
    router.py
    routes/
      health.py
      products.py
  core/
    config.py
  db/
    base.py
    session.py
  models/
    product.py
  schemas/
    product.py
frontend/
  src/
    main.jsx
    styles.css
  index.html
  package.json
  package-lock.json
scripts/
  seed_products.py
.env.example
requirements.txt
```

## Backend Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

## Seed Data

```powershell
python -m scripts.seed_products --reset
```

For a smaller test:

```powershell
python -m scripts.seed_products --total 1000 --batch-size 500 --reset
```

## Frontend Setup

```powershell
cd frontend
npm.cmd install
npm.cmd run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Main API Endpoints

```http
GET /health
GET /products?limit=20
GET /products?limit=20&category=Books
GET /products?limit=20&cursor=<cursor>&snapshot_cursor=<snapshot_cursor>
POST /products/generate-50
```

## Deployment Notes

Recommended free deployment split:

- Frontend: Vercel
- Backend: Koyeb
- Database: TiDB Cloud Starter, MySQL-compatible

Backend start command:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set backend environment variable:

```text
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:PORT/DATABASE
BACKEND_CORS_ORIGINS=https://your-frontend-url
```

Set frontend environment variable:

```text
VITE_API_BASE_URL=https://your-backend-url
```
