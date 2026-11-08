<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/kuahr/.github/main/profile/dark.svg">
  <img src="https://raw.githubusercontent.com/kuahr/.github/main/profile/light.svg" alt="Kua" width="150">
</picture>

# Kua Python SDK

Official client for Kua company people, payroll drafts, workforce resources,
events and webhooks. [Documentation](https://docs.kuahr.com/sdks/python).

## Install

The distribution is `kuahr`, with `import kua`. The unrelated PyPI package
named `kua` is not this SDK.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install kuahr
```

Requires Python 3.9+. On Windows activate `.venv\Scripts\activate` instead.
Store a Test key with `payroll:read` in `KUA_API_KEY`:

```python
import os
from kua import Kua
with Kua(api_key=os.environ["KUA_API_KEY"]) as kua:
    print(kua.payroll_runs.list())
```

## Development

```bash
python -m pip install -e ".[dev]"
python -m pytest -q
```

Expected result: an array of this company's Test payroll runs, including `[]`.
Both Test and Live keys use **https://api.kuahr.com**. The verified key selects
the supported data partition and behaviour; the API address stays the same.

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

## Kua links

- [Kua Developers](https://docs.kuahr.com): integration guides, API reference and official SDKs.
- [Kua](https://kuahr.com): bring your people, payroll and growth together.
- [Kola](https://withkola.com): celebrate people with recognition, rewards and thoughtful giving.

Developer support: engineering@kuahr.com.
