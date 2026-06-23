import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Box,
  ChevronDown,
  Database,
  Filter,
  FlaskConical,
  Layers3,
  Loader2,
  MousePointer2,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Zap,
} from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Books",
  "Fashion",
  "Home",
  "Sports",
  "Beauty",
  "Toys",
  "Grocery",
  "Automotive",
  "Garden",
];

const categoryStyles = {
  Electronics: "blue",
  Books: "green",
  Fashion: "purple",
  Home: "pink",
  Sports: "orange",
  Beauty: "rose",
  Toys: "violet",
  Grocery: "mint",
  Automotive: "slate",
  Garden: "lime",
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getSnapshotTime(snapshotCursor) {
  if (!snapshotCursor) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(snapshotCursor));
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(payload.created_at));
  } catch {
    return null;
  }
}

async function requestJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Request failed");
  }

  return response.json();
}

function buildProductsUrl({ category, cursor, snapshotCursor }) {
  const params = new URLSearchParams({ limit: "20" });

  if (category !== "All Categories") {
    params.set("category", category);
  }

  if (cursor) {
    params.set("cursor", cursor);
    params.set("snapshot_cursor", snapshotCursor);
  }

  return `/products?${params.toString()}`;
}

function App() {
  const [products, setProducts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [snapshotCursor, setSnapshotCursor] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [category, setCategory] = useState("All Categories");
  const [newProductsAvailable, setNewProductsAvailable] = useState(false);
  const [newProductsCount, setNewProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const snapshotTime = useMemo(() => getSnapshotTime(snapshotCursor), [snapshotCursor]);

  async function loadFirstPage(selectedCategory = category) {
    setLoading(true);
    setError(null);

    try {
      const data = await requestJson(
        buildProductsUrl({
          category: selectedCategory,
          cursor: null,
          snapshotCursor: null,
        }),
      );
      setProducts(data.items);
      setNextCursor(data.next_cursor);
      setSnapshotCursor(data.snapshot_cursor);
      setTotalProducts(data.total_products);
      setNewProductsAvailable(false);
      setNewProductsCount(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const data = await requestJson(
        buildProductsUrl({
          category,
          cursor: nextCursor,
          snapshotCursor,
        }),
      );
      setProducts((current) => [...current, ...data.items]);
      setNextCursor(data.next_cursor);
      setSnapshotCursor(data.snapshot_cursor);
      setTotalProducts(data.total_products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function generateProducts() {
    setGenerating(true);
    setError(null);

    try {
      const data = await requestJson("/products/generate-50", { method: "POST" });
      setTotalProducts(data.total_products);
      setNewProductsCount(data.inserted);
      setNewProductsAvailable(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function changeCategory(event) {
    const selectedCategory = event.target.value;
    setCategory(selectedCategory);
    loadFirstPage(selectedCategory);
  }

  function refreshLatestProducts() {
    setProducts([]);
    setNextCursor(null);
    setSnapshotCursor(null);
    loadFirstPage(category);
  }

  useEffect(() => {
    loadFirstPage();
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <div className="brand">
          <div className="brandMark">
            <ShoppingBag size={34} />
          </div>
          <div>
            <h1>Product Browser</h1>
            <p>Browse 200,000+ products with fast, consistent pagination</p>
          </div>
        </div>

        <div className="metrics">
          <Metric icon={<Box />} label="Total Products" value={formatNumber(totalProducts)} />
          <Metric icon={<MousePointer2 />} label="Pagination" value="Cursor Based" tone="green" />
          <Metric icon={<Filter />} label="Sort Order" value="Newest First" tone="orange" />
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}

      <div className="content">
        <section className="mainPane">
          <div className="filterPanel">
            <label htmlFor="category">Filter by Category</label>
            <div className="selectWrap">
              <Layers3 size={18} />
              <select id="category" value={category} onChange={changeCategory}>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} />
            </div>
          </div>

          <div className="listHeader">
            <h2>Showing {products.length} products</h2>
          </div>

          <div className="productList">
            {loading ? (
              <div className="loadingRow">
                <Loader2 size={22} className="spin" />
                Loading products
              </div>
            ) : (
              products.map((product) => <ProductRow key={product.id} product={product} />)
            )}
          </div>

          <div className="loadMoreArea">
            <button className="primaryButton" onClick={loadMore} disabled={!nextCursor || loadingMore}>
              {loadingMore ? <Loader2 size={18} className="spin" /> : <ChevronDown size={18} />}
              Load More
            </button>
            <p>Using cursor for next set of 20 products</p>
          </div>

          <div className="proofBar">
            <Proof icon={<ShieldCheck />} title="No Duplicates" text="Cursor bounds exclude records already loaded." />
            <Proof icon={<ShieldCheck />} title="No Missing Records" text="Snapshot consistency keeps the browsing window stable." />
            <Proof icon={<Zap />} title="Fast Performance" text="Indexed queries avoid OFFSET scans." />
            <Proof icon={<Database />} title="200K+ Products" text="Seeded data exercises realistic volume." />
          </div>
        </section>

        <aside className="testPanel">
          <div className="panelTitle">
            <FlaskConical size={21} />
            <h2>Pagination Consistency Demo</h2>
          </div>

          <div className="addBox">
            <h3>Add 50 New Products</h3>
            <p>Simulate new products being added</p>
            <button className="successButton" onClick={generateProducts} disabled={generating}>
              {generating ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
              Add 50 Products
            </button>
          </div>

          <CountBlock label="Dataset Size" value={totalProducts} />
          <CountBlock label="New Products Inserted" value={newProductsCount} tone="green" prefix="+" />

          <div className="snapshotBox">
            <Package size={20} />
            <div>
              <h3>Snapshot Active</h3>
              <strong>{snapshotTime ? `Snapshot Time: ${snapshotTime}` : "Snapshot Time: Loading"}</strong>
              <p>Your current browsing session is stable and not affected by new inserts.</p>
            </div>
          </div>

          {newProductsAvailable ? (
            <div className="noticeBox">
              <Bell size={20} />
              <div>
                <h3>{newProductsCount} New Products Available</h3>
                <p>Refresh to see latest products. The current list still uses the active snapshot.</p>
              </div>
            </div>
          ) : null}

          <button className="refreshButton" onClick={refreshLatestProducts}>
            <RefreshCw size={18} />
            Refresh To See Latest Products
          </button>
        </aside>
      </div>
    </main>
  );
}

function Metric({ icon, label, value, tone = "blue" }) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="metricIcon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ProductRow({ product }) {
  const tone = categoryStyles[product.category] || "blue";

  return (
    <article className="productRow">
      <div className={`productIcon ${tone}`}>
        <Tag size={24} />
      </div>
      <div className="productInfo">
        <h3>{product.name}</h3>
        <div className="productMeta">
          <span className={`categoryPill ${tone}`}>{product.category}</span>
          <span>ID: {product.id}</span>
        </div>
      </div>
      <strong className="price">{formatPrice(product.price)}</strong>
      <div className="createdAt">
        <span>Created At</span>
        <time>{formatDate(product.created_at)}</time>
      </div>
    </article>
  );
}

function Proof({ icon, title, text }) {
  return (
    <div className="proof">
      <div className="proofIcon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function CountBlock({ label, value, tone, prefix = "" }) {
  return (
    <div className={`countBlock ${tone || ""}`}>
      <span>{label}</span>
      <strong>{prefix}{formatNumber(value)}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
