# Kua Node.js / TypeScript SDK

Official client for Kua company people, payroll drafts, workforce resources,
events and webhooks. [Documentation](https://docs.kuahr.com/sdks/node).

## Install from public source

Source version 0.3.0 is available here; registry publication is pending. Do not
assume `npm install @kua/node` retrieves this release.

```bash
git clone --branch main https://github.com/kuahr/kua-sdk.git
cd kua-sdk/node
npm ci
npm run build
# From your application directory:
npm install /absolute/path/to/kua-sdk/node
```

Requires Node.js 18+. Store a sandbox-issued Test key with `payroll:read` in
`KUA_API_KEY`, then make a read-only request:

```ts
import { Kua } from "@kua/node";
const kua = new Kua({
  apiKey: process.env.KUA_API_KEY!,
  baseUrl: "https://sandbox-api.kuahr.com",
});
console.log(await kua.payrollRuns.list());
```

## Development

```bash
npm ci
npm run typecheck
npm run build
npm test
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
