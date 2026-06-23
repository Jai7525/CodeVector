# Product Browser

FastAPI + TiDB (MySQL-compatible) product browser demonstrating cursor pagination and snapshot consistency over 200,000 products.

A backend-focused product catalog system built for the CodeVector Internship Take-Home Assignment.

The goal was to support browsing 200,000+ products while maintaining correct pagination when data changes during browsing.

## Key Challenges

### Fast Pagination

Using OFFSET pagination on large datasets becomes slower as page numbers increase and can produce inconsistent results when new records are inserted.

To solve this, I implemented cursor-based pagination using:

(created_at, id)

This provides stable ordering and efficient retrieval without expensive OFFSET scans.

### Consistency While Data Changes

The assignment required that users should not see duplicate products or miss products if new products are added while browsing.

To address this, I implemented snapshot-based pagination.

When a browsing session starts:

1. A snapshot boundary is created.
2. All subsequent pages are fetched within that snapshot.
3. Newly inserted products are excluded from the active session.
4. Users can refresh to start a new session and view the latest products.

Result:

* No duplicate products
* No missing products
* Stable browsing experience

### Demonstration

The application includes an "Add 50 Products" consistency demo.

This intentionally modifies the dataset while browsing is in progress to demonstrate that pagination remains stable and correct even when new products are inserted.

## Technical Decisions

### Backend

* FastAPI
* SQLAlchemy

### Database

* TiDB Cloud (MySQL Compatible)

### Pagination Strategy

* Cursor Pagination
* Snapshot Consistency

### Data Generation

* 200,000 products
* Batch inserts (5,000 per batch)
* Dedicated seed script

### Indexing

* (created_at, id)
* (category, created_at, id)

These indexes support efficient newest-first browsing and category filtering.

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
backend/
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
  scripts/
    seed_products.py
  .env.example
  requirements.txt
frontend/
  src/
    main.jsx
    styles.css
  index.html
  package.json
  package-lock.json
```

## Backend Setup

```powershell
cd backend
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
cd backend
python -m scripts.seed_products --reset
```

For a smaller test:

```powershell
cd backend
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
