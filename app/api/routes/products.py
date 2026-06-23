from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.api.cursor import decode_cursor, encode_cursor
from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import GenerateProductsResponse, ProductPageResponse


router = APIRouter(prefix="/products", tags=["products"])

GENERATED_PRODUCT_COUNT = 50
DEMO_CATEGORIES = (
    "Electronics",
    "Books",
    "Fashion",
    "Home",
    "Sports",
)
DEMO_PRODUCT_NAMES = (
    "Demo Wireless Charger",
    "Demo Travel Mug",
    "Demo Desk Organizer",
    "Demo Fitness Band",
    "Demo Reading Lamp",
)


def cursor_before(created_at, product_id):
    return or_(
        Product.created_at < created_at,
        and_(
            Product.created_at == created_at,
            Product.id < product_id,
        ),
    )


def cursor_at_or_before(created_at, product_id):
    return or_(
        Product.created_at < created_at,
        and_(
            Product.created_at == created_at,
            Product.id <= product_id,
        ),
    )


def create_snapshot_cursor(db: Session) -> str:
    query = select(Product).order_by(Product.created_at.desc(), Product.id.desc()).limit(1)
    product = db.scalars(query).first()

    if product is None:
        snapshot_time = datetime.now(UTC).replace(tzinfo=None)
        return encode_cursor(snapshot_time, 0)

    return encode_cursor(product.created_at, product.id)


@router.get("", response_model=ProductPageResponse)
def list_products(
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    cursor: str | None = None,
    snapshot_cursor: str | None = None,
    category: str | None = None,
) -> ProductPageResponse:
    if cursor is not None and snapshot_cursor is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="snapshot_cursor is required when cursor is provided",
        )

    if snapshot_cursor is None:
        snapshot_cursor = create_snapshot_cursor(db)

    snapshot_created_at, snapshot_id = decode_cursor(snapshot_cursor)

    query = select(Product)

    if category is not None:
        query = query.where(Product.category == category)

    query = query.where(cursor_at_or_before(snapshot_created_at, snapshot_id))

    if cursor is not None:
        cursor_created_at, cursor_id = decode_cursor(cursor)
        query = query.where(cursor_before(cursor_created_at, cursor_id))

    query = query.order_by(Product.created_at.desc(), Product.id.desc()).limit(limit + 1)
    rows = list(db.scalars(query))
    items = rows[:limit]

    next_cursor = None
    if len(rows) > limit:
        last_product = items[-1]
        next_cursor = encode_cursor(last_product.created_at, last_product.id)

    total_products = db.scalar(select(func.count()).select_from(Product)) or 0

    return ProductPageResponse(
        items=items,
        next_cursor=next_cursor,
        snapshot_cursor=snapshot_cursor,
        total_products=total_products,
    )


@router.post("/generate-50", response_model=GenerateProductsResponse)
def generate_50_products(
    db: Annotated[Session, Depends(get_db)],
) -> GenerateProductsResponse:
    now = datetime.now(UTC).replace(tzinfo=None)
    products = []

    for index in range(GENERATED_PRODUCT_COUNT):
        products.append(
            Product(
                name=f"{DEMO_PRODUCT_NAMES[index % len(DEMO_PRODUCT_NAMES)]} {index + 1}",
                category=DEMO_CATEGORIES[index % len(DEMO_CATEGORIES)],
                price=Decimal("49.99") + Decimal(index),
                created_at=now,
                updated_at=now,
            )
        )

    db.add_all(products)
    db.commit()

    total_products = db.scalar(select(func.count()).select_from(Product))

    return GenerateProductsResponse(
        inserted=GENERATED_PRODUCT_COUNT,
        total_products=total_products or 0,
    )
