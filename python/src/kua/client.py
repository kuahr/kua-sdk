"""The Kua API client."""

from __future__ import annotations

from typing import Optional

import httpx

from ._http import _Transport
from .resources import (
    Advances,
    Employees,
    Events,
    Leave,
    PayrollRuns,
    Performance,
    TestData,
    Webhooks,
)


class Kua:
    """The Kua API client.

    ```python
    from kua import Kua

    kua = Kua(api_key="kua_live_…")
    runs = kua.payroll_runs.list()
    ```

    Can be used as a context manager to close the underlying HTTP connection::

        with Kua(api_key=...) as kua:
            kua.payroll_runs.list()
    """

    def __init__(
        self,
        api_key: str,
        *,
        base_url: Optional[str] = None,
        timeout: float = 30.0,
        _http_client: Optional[httpx.Client] = None,
    ) -> None:
        self._transport = _Transport(
            api_key, base_url=base_url, timeout=timeout, _client=_http_client
        )
        self.payroll_runs = PayrollRuns(self._transport)
        self.employees = Employees(self._transport)
        self.events = Events(self._transport)
        self.webhooks = Webhooks(self._transport)
        self.test_data = TestData(self._transport)
        self.leave = Leave(self._transport)
        self.advances = Advances(self._transport)
        self.performance = Performance(self._transport)

    def close(self) -> None:
        self._transport.close()

    def __enter__(self) -> "Kua":
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()
