import hashlib
import hmac
import time

import httpx
import pytest

from kua import Kua, KuaError, verify_signature


def _client(handler):
    """A Kua client whose HTTP calls are served by `handler` (a MockTransport)."""
    http = httpx.Client(base_url="https://api.kuahr.com", transport=httpx.MockTransport(handler))
    return Kua(api_key="kua_test_abc", _http_client=http)


def test_verify_signature_roundtrip():
    secret = "whsec_test"
    body = '{"id":"evt_1","type":"webhook.ping"}'
    t = int(time.time())
    v1 = hmac.new(secret.encode(), f"{t}.{body}".encode(), hashlib.sha256).hexdigest()
    header = f"t={t},v1={v1}"

    assert verify_signature(body, header, secret) is True
    assert verify_signature(body, header, "wrong") is False
    assert verify_signature(body + "x", header, secret) is False
    assert verify_signature(body, None, secret) is False


def test_verify_signature_rejects_stale():
    secret = "whsec_test"
    body = "{}"
    t = int(time.time()) - 3600
    v1 = hmac.new(secret.encode(), f"{t}.{body}".encode(), hashlib.sha256).hexdigest()
    header = f"t={t},v1={v1}"
    assert verify_signature(body, header, secret) is False
    assert verify_signature(body, header, secret, tolerance_seconds=0) is True


def test_list_payroll_runs_sends_api_key():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["key"] = request.headers.get("X-Api-Key")
        seen["url"] = str(request.url)
        return httpx.Response(
            200,
            json=[{
                "id": "run_1", "year": 2026, "month": 7, "status": "Draft",
                "currencyIsoCode": "NGN", "hrApprovedAt": None, "disbursementCompletedAt": None,
            }],
        )

    kua = _client(handler)
    runs = kua.payroll_runs.list()

    assert len(runs) == 1
    assert runs[0].id == "run_1"
    assert runs[0].currency_iso_code == "NGN"
    assert seen["key"] == "kua_test_abc"
    assert seen["url"] == "https://api.kuahr.com/v1/payroll/runs"


def test_error_maps_to_kuaerror():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"code": "INSUFFICIENT_SCOPE", "message": "missing scope"})

    kua = _client(handler)
    with pytest.raises(KuaError) as exc:
        kua.employees.create(
            first_name="A", last_name="B", email="a@b.com",
            employment_type_id="x", employed_at="2026-07-01",
        )
    assert exc.value.code == "INSUFFICIENT_SCOPE"
    assert exc.value.status == 403


def test_create_employee_camelcases_body_and_forwards_idempotency():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        import json
        seen["body"] = json.loads(request.content)
        seen["idem"] = request.headers.get("Idempotency-Key")
        return httpx.Response(201, json={"id": "e1", "firstName": "A", "lastName": "B", "email": "a@b.com"})

    kua = _client(handler)
    emp = kua.employees.create(
        first_name="A", last_name="B", email="a@b.com",
        employment_type_id="et_1", employed_at="2026-07-01",
        idempotency_key="abc-123",
    )
    assert emp.id == "e1"
    assert seen["body"]["firstName"] == "A"
    assert seen["body"]["employmentTypeId"] == "et_1"
    assert seen["idem"] == "abc-123"


def test_leave_create_type_camelcases_body():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        import json
        seen["body"] = json.loads(request.content)
        seen["url"] = str(request.url)
        return httpx.Response(201, json={
            "id": "lt1", "name": "Annual leave", "defaultDaysPerYear": 20, "isPaid": True,
            "maxCarryoverDays": 5, "genderRestriction": "Anyone", "isActive": True,
            "createdAt": "2026-07-20T12:00:00+00:00",
        })

    kua = _client(handler)
    t = kua.leave.create_type(name="Annual leave", default_days_per_year=20, is_paid=True, max_carryover_days=5)
    assert seen["url"].endswith("/v1/leave/types")
    assert seen["body"]["defaultDaysPerYear"] == 20
    assert seen["body"]["genderRestriction"] == "Anyone"
    assert t.name == "Annual leave"
    assert t.default_days_per_year == 20


def test_advances_request_and_list_filter():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        if request.method == "POST":
            import json
            seen["body"] = json.loads(request.content)
            return httpx.Response(201, json={
                "id": "a1", "employeeId": "e1", "amountMinor": 5000000, "totalRepayableMinor": 5000000,
                "currencyIsoCode": "NGN", "termMonths": 3, "status": "Pending",
                "disbursedAt": None, "createdAt": "2026-07-20T11:00:00+00:00",
            })
        return httpx.Response(200, json=[])

    kua = _client(handler)
    adv = kua.advances.request(employee_id="e1", amount_minor=5000000, term_months=3)
    assert seen["body"]["employeeId"] == "e1"
    assert seen["body"]["termMonths"] == 3
    assert adv.status == "Pending"
    assert adv.amount_minor == 5000000

    kua.advances.list(employee_id="e1")
    assert "employeeId=e1" in seen["url"]


def test_performance_create_objective_parses_nested_detail():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        import json
        seen["url"] = str(request.url)
        seen["body"] = json.loads(request.content)
        return httpx.Response(201, json={
            "objective": {
                "id": "o1", "ownerEmployeeId": "e1", "title": "Grow", "description": None,
                "cycleLabel": "2026 Q3", "cycleStart": "2026-07-01", "cycleEnd": "2026-09-30",
                "status": "Active", "createdAt": "2026-07-01T09:00:00+00:00", "updatedAt": "2026-07-01T09:00:00+00:00",
            },
            "keyResults": [{
                "id": "kr1", "objectiveId": "o1", "description": "Reach 50k",
                "targetValue": 50000, "currentValue": 0, "unit": "users", "confidenceScore": 0.5,
            }],
            "checkIns": [],
        })

    kua = _client(handler)
    detail = kua.performance.objectives.create(
        title="Grow", cycle_label="2026 Q3", cycle_start="2026-07-01", cycle_end="2026-09-30",
        key_results=[{"description": "Reach 50k", "targetValue": 50000, "unit": "users"}],
    )
    assert seen["url"].endswith("/v1/performance/objectives")
    assert seen["body"]["keyResults"][0]["targetValue"] == 50000
    assert detail.objective.id == "o1"
    assert detail.key_results[0].confidence_score == 0.5


def test_performance_key_result_update_uses_patch():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["method"] = request.method
        return httpx.Response(200, json={
            "id": "kr1", "objectiveId": "o1", "description": "x",
            "targetValue": 1, "currentValue": 10, "unit": "u", "confidenceScore": 1,
        })

    kua = _client(handler)
    kr = kua.performance.key_results.update("kr1", current_value=10)
    assert seen["method"] == "PATCH"
    assert kr.current_value == 10


def test_webhooks_list_unwraps_envelope():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"webhooks": [{
            "id": "wh_1", "url": "https://x.test", "description": None,
            "eventTypes": "*", "isActive": True, "createdAt": "2026-07-20T12:00:00+00:00",
        }]})

    kua = _client(handler)
    hooks = kua.webhooks.list()
    assert len(hooks) == 1
    assert hooks[0].id == "wh_1"
    assert hooks[0].is_active is True


def test_events_preserves_exact_paired_cursor_through_response_and_query():
    timestamp = "2026-11-01T12:00:00.123456+00:00"
    event_id = "80000000-0000-0000-0000-000000000000"
    calls = []
    event = {"id": event_id, "occurredAt": timestamp, "eventType": "payroll.created",
             "aggregateType": "PayrollRun", "aggregateId": "run1", "payload": "{}"}

    def handler(request):
        calls.append(request)
        return httpx.Response(200, json=[event] if len(calls) == 1 else [])

    kua = _client(handler)
    page = kua.events.list(event_type="payroll.created", limit=100)
    assert page[0].occurred_at == timestamp
    assert "since" not in calls[0].url.params
    assert "afterId" not in calls[0].url.params
    cursor = {"since": page[0].occurred_at, "after_id": page[0].id}
    assert kua.events.list(**cursor, event_type="payroll.created", limit=100) == []
    assert calls[1].url.path == "/v1/events"
    assert calls[1].url.params["since"] == timestamp
    assert calls[1].url.params["afterId"] == event_id
    assert "after_id" not in calls[1].url.params
    assert calls[1].url.params["eventType"] == "payroll.created"
    assert calls[1].url.params["limit"] == "100"
    kua.events.list(since=timestamp)
    assert "afterId" not in calls[2].url.params


def test_events_propagates_api_invalid_cursor_response():
    kua = _client(lambda request: httpx.Response(
        400, json={"code": "INVALID_CURSOR", "message": "afterId requires since"}))
    with pytest.raises(KuaError) as exc:
        kua.events.list(after_id="80000000-0000-0000-0000-000000000000")
    assert exc.value.status == 400


def test_webhook_replay_and_history_preserve_identity_and_request_key():
    import json
    calls = []

    def handler(request):
        calls.append(request)
        if request.method == "GET":
            return httpx.Response(200, json={"attempts": [{"id": "a1", "attemptNumber": 6, "outcome": "Unknown"}], "replays": []})
        return httpx.Response(202, json={"replayId": "r1", "deliveryId": "delivery-1", "status": "Pending", "message": "Replay queued"})

    kua = _client(handler)
    history = kua.webhooks.history("endpoint-1", "delivery-1")
    assert history.attempts[0].outcome == "Unknown"
    accepted = kua.webhooks.replay("endpoint-1", "delivery-1", request_key="stable-replay-1", reason="Receiver repaired")
    kua.webhooks.replay("endpoint-1", "delivery-1", request_key="stable-replay-1", reason="Receiver repaired")
    assert calls[0].url.path == "/v1/webhooks/endpoint-1/deliveries/delivery-1/history"
    assert calls[1].url.path == "/v1/webhooks/endpoint-1/deliveries/delivery-1/replay"
    assert calls[1].method == "POST"
    assert json.loads(calls[1].content) == {"requestKey": "stable-replay-1", "reason": "Receiver repaired"}
    assert calls[1].content == calls[2].content
    assert accepted.status == "Pending"
