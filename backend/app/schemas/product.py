from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    price: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductPageResponse(BaseModel):
    items: list[ProductResponse]
    next_cursor: str | None
    snapshot_cursor: str
    total_products: int


class GenerateProductsResponse(BaseModel):
    inserted: int
    total_products: int
