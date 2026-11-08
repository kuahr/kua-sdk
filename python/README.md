# Kua Python SDK

Official client for Kua company people, payroll drafts, workforce resources,
events and webhooks. [Documentation](https://docs.kuahr.com/sdks/python).

## Install from public source

Source version 0.3.0 is available here; registry publication is pending. The
distribution name is `kuahr`, with `import kua`. The unrelated PyPI package
named `kua` is not this SDK.

```bash
python -m venv .venv
source .venv/bin/activate
git clone --branch main https://github.com/kuahr/kua-sdk.git
python -m pip install ./kua-sdk/python
```

Requires Python 3.9+. On Windows activate `.venv\Scripts\activate` instead.
Store a sandbox-issued Test key with `payroll:read` in `KUA_API_KEY`:

```python
import os
from kua import Kua
with Kua(api_key=os.environ["KUA_API_KEY"], base_url="https://sandbox-api.kuahr.com") as kua:
    print(kua.payroll_runs.list())
```

## Development

```bash
python -m pip install -e ".[dev]"
python -m pytest -q
```

Expected result: an array of this company's Test payroll runs, including `[]`.
Choose the host explicitly: both clients otherwise default to production.

## Supported boundaries

Employee creation and payroll draft/list operations support Test mode. Events,
webhooks and workforce add-ons require a separately authorised Live key with the
matching resource scopes. Draft creation is not approval or payment; salary setup
is outside this public SDK. Registered-client Kola OIDC uses HTTP separately.

The client does not retry automatically. Persist an operation-specific idempotency
key and exact request before writes. Credential rotation changes that namespace;
reconcile uncertain outcomes before retrying under another credential. Webhook
replay uses a separate stable request key/reason. Queued is not delivered.

## Webhooks and production readiness

Use the included raw-body signature helper and timestamp tolerance, then
deduplicate the verified body's event ID. Commit durable acceptance before
acknowledging a delivery. Follow setup, recovery, rotation and go-live guidance at
https://docs.kuahr.com. Never log credentials or signing secrets.

## Licence

MIT. See LICENSE.
