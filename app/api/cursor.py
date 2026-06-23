import base64
import binascii
import json
from datetime import datetime

from fastapi import HTTPException, status


def encode_cursor(created_at: datetime, product_id: int) -> str:
    payload = {
        "created_at": created_at.isoformat(),
        "id": product_id,
    }
    raw_cursor = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw_cursor).decode("ascii")


def decode_cursor(cursor: str) -> tuple[datetime, int]:
    try:
        decoded = base64.urlsafe_b64decode(cursor.encode("ascii"))
        payload = json.loads(decoded)
        created_at = datetime.fromisoformat(payload["created_at"])
        product_id = int(payload["id"])
    except (KeyError, TypeError, ValueError, binascii.Error, json.JSONDecodeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid cursor",
        )

    return created_at, product_id
