"""Error types for the Kua SDK."""

from __future__ import annotations


class KuaError(Exception):
    """Raised when the Kua API returns a non-2xx response.

    Attributes:
        code: A stable, machine-readable identifier you can branch on
            (e.g. ``"INSUFFICIENT_SCOPE"``).
        status: The HTTP status code.
    """

    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message

    def __repr__(self) -> str:  # pragma: no cover - repr convenience
        return f"KuaError(status={self.status!r}, code={self.code!r}, message={self.message!r})"
