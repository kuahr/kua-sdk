"""Internal HTTP transport."""

from __future__ import annotations

from typing import Any, Dict, Optional

import httpx

from .errors import KuaError

DEFAULT_BASE_URL = "https://api.kuahr.com"
CLIENT_VERSION = "0.3.0"


class _Transport:
    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        timeout: float = 30.0,
        _client: Optional[httpx.Client] = None,
    ) -> None:
        if not api_key:
            raise ValueError("Kua: `api_key` is required.")
        self._client = _client or httpx.Client(
            base_url=(base_url or DEFAULT_BASE_URL).rstrip("/"),
            timeout=timeout,
        )
        # Apply auth/identity headers to the client regardless of whether it was
        # constructed here or injected (e.g. in tests).
        self._client.headers.update(
            {
                "X-Api-Key": api_key,
                "Accept": "application/json",
                "User-Agent": f"kua-python/{CLIENT_VERSION}",
            }
        )

    def request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Any] = None,
        idempotency_key: Optional[str] = None,
    ) -> Any:
        headers = {}
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        clean_params = {k: v for k, v in (params or {}).items() if v is not None}

        res = self._client.request(
            method, path, params=clean_params or None, json=json, headers=headers or None
        )

        if res.status_code == 204:
            return None

        data: Any = None
        if res.content:
            try:
                data = res.json()
            except ValueError:
                data = None

        if res.status_code >= 400:
            code = (data or {}).get("code") if isinstance(data, dict) else None
            message = (data or {}).get("message") if isinstance(data, dict) else None
            raise KuaError(
                res.status_code,
                code or f"HTTP_{res.status_code}",
                message or f"Kua request failed with status {res.status_code}.",
            )

        return data

    def close(self) -> None:
        self._client.close()
