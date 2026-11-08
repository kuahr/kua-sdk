"""Webhook signature verification."""

from __future__ import annotations

import hashlib
import hmac
import time
from typing import Optional, Union


def verify_signature(
    raw_body: Union[str, bytes],
    header: Optional[str],
    secret: str,
    tolerance_seconds: int = 300,
) -> bool:
    """Verify the ``X-Kua-Signature`` header on an incoming webhook.

    Kua signs ``HMAC-SHA256(secret, "{t}.{raw_body}")`` and sends it as
    ``X-Kua-Signature: t={unix_seconds},v1={hex}``. Verify against the **raw**
    request body (the exact bytes received), before any JSON parsing.

    Args:
        raw_body: The raw request body, exactly as received.
        header: The value of the ``X-Kua-Signature`` header.
        secret: Your endpoint's signing secret (``whsec_…``).
        tolerance_seconds: Reject deliveries older than this many seconds
            (replay protection). Set to 0 to disable. Default 300.

    Returns:
        ``True`` if the signature is valid (and, if enabled, fresh).
    """
    if not header:
        return False

    parts = {}
    for kv in header.split(","):
        if "=" not in kv:
            continue
        key, _, value = kv.partition("=")
        parts[key.strip()] = value.strip()

    t = parts.get("t")
    v1 = parts.get("v1")
    if not t or not v1:
        return False

    if tolerance_seconds > 0:
        try:
            ts = int(t)
        except ValueError:
            return False
        if abs(int(time.time()) - ts) > tolerance_seconds:
            return False

    body = raw_body if isinstance(raw_body, bytes) else raw_body.encode("utf-8")
    expected = hmac.new(
        secret.encode("utf-8"), f"{t}.".encode("utf-8") + body, hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, v1)
