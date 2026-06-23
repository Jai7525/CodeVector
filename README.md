# Product Browser

A backend-focused product catalog system built for the CodeVector Internship Take-Home Assignment.

The goal was to support browsing 200,000+ products while maintaining correct pagination behavior when data changes during browsing.

---

# Live Demo

Frontend

[https://code-vector-sand.vercel.app/]

Backend

[https://codevector-backend-gkf4.onrender.com]

GitHub Repository

[YOUR_GITHUB_REPO_URL]

---

# Problem Statement

Build a backend that allows users to:

* Browse approximately 200,000 products
* Filter products by category
* View products newest first
* Support fast pagination
* Maintain correct results while new products are inserted during browsing

The key challenge is ensuring users do not see duplicate products or miss products while navigating pages if the dataset changes.

---

# Key Design Decisions

## Cursor Pagination

Instead of OFFSET pagination, this project uses cursor-based pagination.

Pagination order:

(created_at DESC, id DESC)

Why?

* OFFSET becomes slower as page numbers increase
* OFFSET can create duplicate or missing records when new data is inserted
* Cursor pagination provides stable ordering and efficient retrieval

Each response returns a cursor based on the last product from the current page.

---

## Snapshot Consistency

The assignment requires correct pagination while data changes.

When a user loads the first page:

1. A snapshot cursor is created
2. All subsequent pages use the same snapshot boundary
3. Products inserted after the snapshot are excluded from the current session
4. Refreshing creates a new snapshot and shows the latest data

Benefits:

* No duplicate products
* No missing products
* Stable browsing experience

---

## Add 50 Products Demo

The UI includes an Add 50 Products button.

Purpose:

Demonstrate pagination consistency while data changes.

Behavior:

* Inserts 50 new products into the database
* Existing browsing session remains stable
* Snapshot remains active
* New products become visible only after refresh

This intentionally modifies the dataset to validate the assignment requirement.

---

# Architecture

Frontend

* React
* Vite
* Tailwind CSS

Backend

* FastAPI
* SQLAlchemy

Database

* TiDB Cloud (MySQL Compatible)

Deployment

* Frontend → Vercel
* Backend → Render
* Database → TiDB Cloud

---

# Database Schema

Products

* id
* name
* category
* price
* created_at
* updated_at

Indexes

* (created_at, id)
* (category, created_at, id)

These indexes support:

* Fast newest-first browsing
* Fast category filtering
* Efficient cursor pagination

---

# Generating 200,000 Products

A dedicated seed script generates the dataset.

Approach:

* Batch inserts
* 5,000 records per batch
* Randomized categories
* Randomized pricing
* Realistic timestamps

Why batch inserts?

Inserting rows one at a time would generate unnecessary database round trips and significantly slower execution.

Run:

```bash
cd backend
python -m scripts.seed_products --reset
```

Smaller dataset:

```bash
python -m scripts.seed_products --total 1000 --batch-size 500 --reset
```

---

# Project Structure

```text
backend/
  app/
    api/
    core/
    db/
    models/
    schemas/
  scripts/
    seed_products.py

frontend/
  src/
  public/
```

---

# Backend Setup

```bash
cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

Copy-Item .env.example .env

python -m uvicorn app.main:app --reload
```

Health Check:

```text
http://127.0.0.1:8000/health
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

---

# API Endpoints

Health Check

```http
GET /health
```

Products

```http
GET /products?limit=20
```

Category Filter

```http
GET /products?limit=20&category=Books
```

Pagination

```http
GET /products?limit=20&cursor=<cursor>&snapshot_cursor=<snapshot_cursor>
```

Consistency Demo

```http
POST /products/generate-50
```

---

# Production Deployment

Frontend

Vercel

Backend

Render

Database

TiDB Cloud

Backend Start Command

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Backend Environment Variables

```env
DATABASE_URL=mysql+pymysql://<username>:<password>@<host>:4000/product_browser
BACKEND_CORS_ORIGINS=https://code-vector-sand.vercel.app/
```

Frontend Environment Variables

```env
VITE_API_BASE_URL= https://codevector-backend-gkf4.onrender.com
```

---

# AI Usage

AI tools were used for:

* Research
* Reviewing pagination approaches
* Exploring edge cases
* Deployment troubleshooting

AI accelerated implementation and learning, but final architectural decisions, pagination validation, snapshot consistency behavior, indexing strategy, deployment setup, and testing were manually verified.

During development, some AI-generated suggestions did not fully account for TiDB SSL requirements and deployment-specific constraints. These issues were investigated and corrected manually before the final solution was completed.

---

# Future Improvements

* Automated integration tests
* Load testing and benchmarking
* Query analytics
* Monitoring dashboard
* Docker deployment
* CI/CD pipeline

---

# Lessons Learned

This project was a practical exercise in designing pagination for large datasets.

The most important takeaway was understanding that fast pagination is only part of the problem. Correctness during concurrent data changes is equally important. Implementing snapshot-based browsing helped ensure a stable user experience while the dataset continued to evolve.

---

# Author

Jayakumar M

B.Tech Information Technology

Vel Tech Multi Tech Dr. Rangarajan Dr. Sakunthala Engineering College

GitHub:
https://github.com/Jai7525
