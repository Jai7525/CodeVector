import argparse
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from random import Random
from time import perf_counter

from sqlalchemy import delete, func, insert, select


TOTAL_PRODUCTS = 200_000
BATCH_SIZE = 5_000
RANDOM_SEED = 42

CATEGORIES = (
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
)

PRODUCT_TYPES = (
    "Wireless Headphones",
    "Running Shoes",
    "Desk Lamp",
    "Coffee Maker",
    "Backpack",
    "Yoga Mat",
    "Cookbook",
    "Smart Watch",
    "Office Chair",
    "Water Bottle",
    "Bluetooth Speaker",
    "Cotton T-Shirt",
    "Garden Planter",
    "Car Vacuum",
    "Skin Serum",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed products table with test data.")
    parser.add_argument("--total", type=int, default=TOTAL_PRODUCTS)
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing products before inserting seed data.",
    )
    return parser.parse_args()


def build_product_batch(
    start: int,
    count: int,
    total: int,
    now: datetime,
    rng: Random,
) -> list[dict[str, object]]:
    rows = []
    history_window = timedelta(days=180).total_seconds()

    for index in range(start, start + count):
        category = CATEGORIES[index % len(CATEGORIES)]
        product_type = PRODUCT_TYPES[index % len(PRODUCT_TYPES)]
        product_number = index + 1
        seconds_ago = int((index / total) * history_window) + rng.randint(0, 300)
        created_at = now - timedelta(seconds=seconds_ago)
        updated_at = created_at + timedelta(days=rng.randint(0, 14))

        if updated_at > now:
            updated_at = now

        rows.append(
            {
                "name": f"{product_type} {product_number}",
                "category": category,
                "price": Decimal(rng.randint(499, 299_999)) / Decimal("100"),
                "created_at": created_at,
                "updated_at": updated_at,
            }
        )

    return rows


def seed_products(total: int, batch_size: int, reset: bool) -> None:
    from app.db.base import Base
    from app.db.session import SessionLocal, engine
    from app.models.product import Product

    if total <= 0:
        raise ValueError("total must be greater than 0")

    if batch_size <= 0:
        raise ValueError("batch-size must be greater than 0")

    rng = Random(RANDOM_SEED)
    now = datetime.now(UTC).replace(tzinfo=None)
    started_at = perf_counter()

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        if reset:
            db.execute(delete(Product))
            db.commit()
            print("Deleted existing products.")

        existing_count = db.scalar(select(func.count()).select_from(Product))

        for start in range(0, total, batch_size):
            current_batch_size = min(batch_size, total - start)
            rows = build_product_batch(start, current_batch_size, total, now, rng)
            db.execute(insert(Product), rows)
            db.commit()
            inserted = start + current_batch_size
            print(f"Inserted {inserted:,}/{total:,} products")

    elapsed_seconds = perf_counter() - started_at
    print(f"Existing products before seed: {existing_count:,}")
    print(f"Seeded products requested: {total:,}")
    print(f"Batch size: {batch_size:,}")
    print(f"Execution time: {elapsed_seconds:.2f} seconds")


if __name__ == "__main__":
    args = parse_args()
    seed_products(total=args.total, batch_size=args.batch_size, reset=args.reset)
