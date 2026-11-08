import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";
import { Kua, KuaError, verifySignature } from "../dist/index.js";

test("verifySignature accepts a correctly signed payload", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ id: "evt_1", type: "webhook.ping" });
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  const header = `t=${t},v1=${v1}`;

  assert.equal(verifySignature(body, header, secret), true);
  assert.equal(verifySignature(body, header, "wrong-secret"), false);
  assert.equal(verifySignature(body + "tampered", header, secret), false);
  assert.equal(verifySignature(body, null, secret), false);
});

test("verifySignature rejects stale timestamps", () => {
  const secret = "whsec_test";
  const body = "{}";
  const t = Math.floor(Date.now() / 1000) - 3600; // an hour old
  const v1 = crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  assert.equal(verifySignature(body, `t=${t},v1=${v1}`, secret), false);
  // ...but passes with the replay check disabled.
  assert.equal(verifySignature(body, `t=${t},v1=${v1}`, secret, { toleranceSeconds: 0 }), true);
});

test("client sends X-Api-Key and parses payroll runs", async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(
      JSON.stringify([{ id: "run_1", year: 2026, month: 7, status: "Draft", currencyIsoCode: "NGN", hrApprovedAt: null, disbursementCompletedAt: null }]),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  const kua = new Kua({ apiKey: "kua_test_abc", fetch: fakeFetch });
  const runs = await kua.payrollRuns.list();

  assert.equal(runs.length, 1);
  assert.equal(runs[0].id, "run_1");
  assert.equal(calls[0].url, "https://api.kuahr.com/v1/payroll/runs");
  assert.equal(calls[0].init.headers["X-Api-Key"], "kua_test_abc");
});

test("client maps a non-2xx body to KuaError", async () => {
  const fakeFetch = async () =>
    new Response(JSON.stringify({ code: "INSUFFICIENT_SCOPE", message: "missing scope" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  const kua = new Kua({ apiKey: "k", fetch: fakeFetch });
  await assert.rejects(
    () => kua.employees.create({ firstName: "A", lastName: "B", email: "a@b.com", employmentTypeId: "x", employedAt: "2026-07-01" }),
    (err) => {
      assert.ok(err instanceof KuaError);
      assert.equal(err.code, "INSUFFICIENT_SCOPE");
      assert.equal(err.status, 403);
      return true;
    },
  );
});

test("leave.listRequests builds the query string", async () => {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url);
    return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
  };
  const kua = new Kua({ apiKey: "k", fetch: fakeFetch });
  await kua.leave.listRequests({ status: "Submitted", employeeId: "e1" });
  assert.match(calls[0], /\/v1\/leave\/requests\?/);
  assert.match(calls[0], /status=Submitted/);
  assert.match(calls[0], /employeeId=e1/);
});

test("advances.request posts to /v1/advances with the body", async () => {
  let seen;
  const fakeFetch = async (url, init) => {
    seen = { url, body: JSON.parse(init.body) };
    return new Response(
      JSON.stringify({ id: "a1", employeeId: "e1", amountMinor: 5000000, totalRepayableMinor: 5000000, currencyIsoCode: "NGN", termMonths: 3, status: "Pending", disbursedAt: null, createdAt: "2026-07-20T11:00:00+00:00" }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  };
  const kua = new Kua({ apiKey: "k", fetch: fakeFetch });
  const adv = await kua.advances.request({ employeeId: "e1", amountMinor: 5000000, termMonths: 3 });
  assert.equal(seen.url, "https://api.kuahr.com/v1/advances");
  assert.equal(seen.body.employeeId, "e1");
  assert.equal(adv.status, "Pending");
});

test("performance.objectives.create posts to the nested path", async () => {
  let seen;
  const fakeFetch = async (url, init) => {
    seen = { url, body: JSON.parse(init.body) };
    return new Response(
      JSON.stringify({ objective: { id: "o1", title: "Grow", status: "Active" }, keyResults: [], checkIns: [] }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  };
  const kua = new Kua({ apiKey: "k", fetch: fakeFetch });
  const detail = await kua.performance.objectives.create({
    title: "Grow", cycleLabel: "2026 Q3", cycleStart: "2026-07-01", cycleEnd: "2026-09-30",
    keyResults: [{ description: "Reach 50k", targetValue: 50000, unit: "users" }],
  });
  assert.equal(seen.url, "https://api.kuahr.com/v1/performance/objectives");
  assert.equal(seen.body.keyResults[0].targetValue, 50000);
  assert.equal(detail.objective.id, "o1");
});

test("performance.keyResults.update uses PATCH", async () => {
  let method;
  const fakeFetch = async (_url, init) => {
    method = init.method;
    return new Response(JSON.stringify({ id: "kr1", objectiveId: "o1", description: "x", targetValue: 1, currentValue: 1, unit: "u", confidenceScore: 1 }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const kua = new Kua({ apiKey: "k", fetch: fakeFetch });
  await kua.performance.keyResults.update("kr1", { currentValue: 10 });
  assert.equal(method, "PATCH");
});

test("idempotency key is forwarded", async () => {
  let seen;
  const fakeFetch = async (_url, init) => {
    seen = init.headers["Idempotency-Key"];
    return new Response(JSON.stringify({ id: "e1", firstName: "A", lastName: "B", email: "a@b.com" }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  };
  const kua = new Kua({ apiKey: "k", fetch: fakeFetch });
  await kua.employees.create(
    { firstName: "A", lastName: "B", email: "a@b.com", employmentTypeId: "x", employedAt: "2026-07-01" },
    { idempotencyKey: "abc-123" },
  );
  assert.equal(seen, "abc-123");
});


test("events preserves an exact paired cursor through response and query serialization", async () => {
  const timestamp = "2026-11-01T12:00:00.123456+00:00";
  const id = "80000000-0000-0000-0000-000000000000";
  const calls = [];
  const event = { id, occurredAt: timestamp, eventType: "payroll.created", aggregateType: "PayrollRun", aggregateId: "run1", payload: "{}" };
  const kua = new Kua({ apiKey: "local", fetch: async (url) => {
    calls.push(new URL(url));
    return new Response(JSON.stringify(calls.length === 1 ? [event] : []), { status: 200 });
  }});
  const page = await kua.events.list({ eventType: event.eventType, limit: 100 });
  assert.equal(page[0].occurredAt, timestamp);
  assert.equal(calls[0].searchParams.has("since"), false);
  assert.equal(calls[0].searchParams.has("afterId"), false);
  const cursor = { since: page[0].occurredAt, afterId: page[0].id };
  const empty = await kua.events.list({ ...cursor, eventType: event.eventType, limit: 100 });
  assert.deepEqual(empty, []);
  assert.equal(calls[1].pathname, "/v1/events");
  assert.equal(calls[1].searchParams.get("since"), timestamp);
  assert.equal(calls[1].searchParams.get("afterId"), id);
  assert.equal(calls[1].searchParams.get("eventType"), event.eventType);
  assert.equal(calls[1].searchParams.get("limit"), "100");
  await kua.events.list({ since: timestamp });
  assert.equal(calls[2].searchParams.has("afterId"), false);
});

test("events propagates the API's invalid cursor response", async () => {
  const kua = new Kua({ apiKey: "local", fetch: async () => new Response(
    JSON.stringify({ code: "INVALID_CURSOR", message: "afterId requires since" }), { status: 400 },
  ) });
  await assert.rejects(() => kua.events.list({ afterId: "80000000-0000-0000-0000-000000000000" }),
    err => err instanceof KuaError && err.status === 400);
});

test("webhook replay and history preserve the exact delivery identity and request key", async () => {
  const calls = [];
  const kua = new Kua({ apiKey: "local", fetch: async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(init.method === "GET" ? {
      attempts: [{ id: "a1", attemptNumber: 6, outcome: "Unknown" }], replays: [],
    } : { replayId: "r1", deliveryId: "delivery-1", status: "Pending", message: "Replay queued" }), { status: init.method === "GET" ? 200 : 202 });
  }});
  const history = await kua.webhooks.history("endpoint-1", "delivery-1");
  assert.equal(history.attempts[0].outcome, "Unknown");
  const params = { requestKey: "stable-replay-1", reason: "Receiver repaired and deduplication verified" };
  const accepted = await kua.webhooks.replay("endpoint-1", "delivery-1", params);
  await kua.webhooks.replay("endpoint-1", "delivery-1", params);
  assert.equal(calls[0].url, "https://api.kuahr.com/v1/webhooks/endpoint-1/deliveries/delivery-1/history");
  assert.equal(calls[1].url, "https://api.kuahr.com/v1/webhooks/endpoint-1/deliveries/delivery-1/replay");
  assert.equal(calls[1].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].init.body), params);
  assert.equal(calls[1].init.body, calls[2].init.body);
  assert.equal(accepted.status, "Pending");
});
