"""Resource groups exposed on the Kua client."""

from __future__ import annotations

from typing import List, Optional

from ._http import _Transport
from .models import (
    Advance,
    AppraisalCycle,
    AppraisalReview,
    CheckIn,
    EmployeeCreated,
    EventItem,
    KeyResult,
    LeaveAllocation,
    LeaveBalance,
    LeaveRequest,
    LeaveType,
    Objective,
    ObjectiveDetail,
    PayrollRunCreated,
    PayrollRunSummary,
    Promotion,
    TestDataCleared,
    WebhookCreated,
    WebhookHistory,
    WebhookReplayAccepted,
    WebhookDeliveryItem,
    WebhookPingAccepted,
    WebhookSummary,
)
from .webhooks_verify import verify_signature


class PayrollRuns:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def list(self) -> List[PayrollRunSummary]:
        """List this key's Live/Test payroll runs; requires ``payroll:read``."""
        data = self._t.request("GET", "/v1/payroll/runs")
        return [PayrollRunSummary.from_json(r) for r in data]

    def create(
        self, year: int, month: int, *, idempotency_key: Optional[str] = None
    ) -> PayrollRunCreated:
        """Create a draft payroll run from the roster. Needs ``payroll:write``."""
        data = self._t.request(
            "POST",
            "/v1/payroll/runs",
            json={"year": year, "month": month},
            idempotency_key=idempotency_key,
        )
        return PayrollRunCreated.from_json(data)


class Employees:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def create(
        self,
        *,
        first_name: str,
        last_name: str,
        email: str,
        employment_type_id: str,
        employed_at: str,
        phone_number: Optional[str] = None,
        job_title: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> EmployeeCreated:
        """Add an employee. Needs ``employees:write``. Pass ``idempotency_key``
        to make retries safe."""
        body = {
            "firstName": first_name,
            "lastName": last_name,
            "email": email,
            "employmentTypeId": employment_type_id,
            "employedAt": employed_at,
            "phoneNumber": phone_number,
            "jobTitle": job_title,
        }
        data = self._t.request(
            "POST", "/v1/employees", json=body, idempotency_key=idempotency_key
        )
        return EmployeeCreated.from_json(data)


class Events:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def list(
        self,
        *,
        since: Optional[str] = None,
        after_id: Optional[str] = None,
        event_type: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[EventItem]:
        """List Live events; requires ``events:read``. Test keys are unsupported.
        Results use (occurredAt, id) order. Continue with the last event's
        exact ``occurred_at`` as ``since`` and ``id`` as ``after_id``.
        Since alone retains strict timestamp filtering; after_id requires since.
        """
        data = self._t.request(
            "GET",
            "/v1/events",
            params={"since": since, "afterId": after_id, "eventType": event_type, "limit": limit},
        )
        return [EventItem.from_json(e) for e in data]


class TestData:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def clear(self) -> TestDataCleared:
        """Requires ``test-data:clear``; either key mode clears only this company's Test data."""
        data = self._t.request("POST", "/v1/test-data/clear")
        return TestDataCleared.from_json(data)


class Webhooks:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def create(
        self,
        *,
        url: str,
        description: Optional[str] = None,
        event_types: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> WebhookCreated:
        """Register an endpoint. The signing secret is returned once."""
        body = {"url": url, "description": description, "eventTypes": event_types}
        data = self._t.request(
            "POST", "/v1/webhooks", json=body, idempotency_key=idempotency_key
        )
        return WebhookCreated.from_json(data)

    def list(self) -> List[WebhookSummary]:
        """List your webhook endpoints (without their secrets)."""
        data = self._t.request("GET", "/v1/webhooks")
        return [WebhookSummary.from_json(w) for w in data["webhooks"]]

    def delete(self, webhook_id: str) -> None:
        """Delete a webhook endpoint. Delivery stops immediately."""
        self._t.request("DELETE", f"/v1/webhooks/{webhook_id}")

    def deliveries(
        self, webhook_id: str, *, limit: Optional[int] = None
    ) -> List[WebhookDeliveryItem]:
        """Recent delivery attempts for an endpoint."""
        data = self._t.request(
            "GET", f"/v1/webhooks/{webhook_id}/deliveries", params={"limit": limit}
        )
        return [WebhookDeliveryItem.from_json(d) for d in data["deliveries"]]

    def history(self, webhook_id: str, delivery_id: str) -> WebhookHistory:
        """Retained attempts/replays. Live keys: ``webhooks:read``, ``webhooks:write``, ``webhooks:replay`` or ``*``."""
        data = self._t.request("GET", f"/v1/webhooks/{webhook_id}/deliveries/{delivery_id}/history")
        return WebhookHistory.from_json(data)

    def replay(self, webhook_id: str, delivery_id: str, *, request_key: str, reason: str) -> WebhookReplayAccepted:
        """Queue an exhausted delivery. Retain the same key and reason after a lost response."""
        data = self._t.request("POST", f"/v1/webhooks/{webhook_id}/deliveries/{delivery_id}/replay",
                               json={"requestKey": request_key, "reason": reason})
        return WebhookReplayAccepted.from_json(data)

    def ping(self, webhook_id: str) -> WebhookPingAccepted:
        """Send a test ``webhook.ping`` event to an endpoint."""
        data = self._t.request("POST", f"/v1/webhooks/{webhook_id}/ping")
        return WebhookPingAccepted.from_json(data)

    # Re-exported as a static helper so callers can do kua.webhooks.verify_signature(...).
    verify_signature = staticmethod(verify_signature)


class Leave:
    """Leave APIs require ``leave:read`` / ``leave:write``. Test keys cannot
    read or write unpartitioned leave records; scopes do not replace eligibility."""

    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def list_types(self) -> List[LeaveType]:
        data = self._t.request("GET", "/v1/leave/types")
        return [LeaveType.from_json(t) for t in data]

    def create_type(
        self,
        *,
        name: str,
        default_days_per_year: int,
        is_paid: bool,
        max_carryover_days: int,
        gender_restriction: str = "Anyone",
    ) -> LeaveType:
        body = {
            "name": name,
            "defaultDaysPerYear": default_days_per_year,
            "isPaid": is_paid,
            "maxCarryoverDays": max_carryover_days,
            "genderRestriction": gender_restriction,
        }
        return LeaveType.from_json(self._t.request("POST", "/v1/leave/types", json=body))

    def list_requests(
        self, *, status: Optional[str] = None, employee_id: Optional[str] = None
    ) -> List[LeaveRequest]:
        data = self._t.request(
            "GET", "/v1/leave/requests", params={"status": status, "employeeId": employee_id}
        )
        return [LeaveRequest.from_json(r) for r in data]

    def create_request(
        self,
        *,
        employee_id: str,
        leave_type_id: str,
        start_date: str,
        end_date: str,
        reason: str,
    ) -> LeaveRequest:
        body = {
            "employeeId": employee_id,
            "leaveTypeId": leave_type_id,
            "startDate": start_date,
            "endDate": end_date,
            "reason": reason,
        }
        return LeaveRequest.from_json(self._t.request("POST", "/v1/leave/requests", json=body))

    def approve_request(self, request_id: str, *, comment: Optional[str] = None) -> LeaveRequest:
        data = self._t.request("POST", f"/v1/leave/requests/{request_id}/approve", json={"comment": comment})
        return LeaveRequest.from_json(data)

    def reject_request(self, request_id: str, *, comment: str) -> LeaveRequest:
        data = self._t.request("POST", f"/v1/leave/requests/{request_id}/reject", json={"comment": comment})
        return LeaveRequest.from_json(data)

    def cancel_request(self, request_id: str) -> LeaveRequest:
        return LeaveRequest.from_json(self._t.request("POST", f"/v1/leave/requests/{request_id}/cancel"))

    def balances(self, *, employee_id: str, year: Optional[int] = None) -> List[LeaveBalance]:
        data = self._t.request(
            "GET", "/v1/leave/balances", params={"employeeId": employee_id, "year": year}
        )
        return [LeaveBalance.from_json(b) for b in data]

    def grant_allocation(
        self, *, employee_id: str, leave_type_id: str, year: int, total_days: int, note: Optional[str] = None
    ) -> LeaveAllocation:
        body = {
            "employeeId": employee_id,
            "leaveTypeId": leave_type_id,
            "year": year,
            "totalDays": total_days,
            "note": note,
        }
        return LeaveAllocation.from_json(self._t.request("POST", "/v1/leave/allocations", json=body))


class Advances:
    """Salary advance APIs require ``advances:read`` / ``advances:write``.
    Test keys cannot read or write unpartitioned advance records. Approving disburses real
    money and isn't available with a test-mode key."""

    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def list(self, *, employee_id: Optional[str] = None) -> List[Advance]:
        data = self._t.request("GET", "/v1/advances", params={"employeeId": employee_id})
        return [Advance.from_json(a) for a in data]

    def request(self, *, employee_id: str, amount_minor: int, term_months: int) -> Advance:
        body = {"employeeId": employee_id, "amountMinor": amount_minor, "termMonths": term_months}
        return Advance.from_json(self._t.request("POST", "/v1/advances", json=body))

    def approve(self, advance_id: str) -> Advance:
        return Advance.from_json(self._t.request("POST", f"/v1/advances/{advance_id}/approve"))

    def reject(self, advance_id: str) -> Advance:
        return Advance.from_json(self._t.request("POST", f"/v1/advances/{advance_id}/reject"))


class _Objectives:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def list(
        self, *, cycle_label: Optional[str] = None, owner_employee_id: Optional[str] = None
    ) -> List[Objective]:
        data = self._t.request(
            "GET", "/v1/performance/objectives",
            params={"cycleLabel": cycle_label, "ownerEmployeeId": owner_employee_id},
        )
        return [Objective.from_json(o) for o in data]

    def create(
        self,
        *,
        title: str,
        cycle_label: str,
        cycle_start: str,
        cycle_end: str,
        key_results: List[dict],
        description: Optional[str] = None,
        owner_employee_id: Optional[str] = None,
    ) -> ObjectiveDetail:
        body = {
            "title": title,
            "description": description,
            "cycleLabel": cycle_label,
            "cycleStart": cycle_start,
            "cycleEnd": cycle_end,
            "keyResults": key_results,
        }
        if owner_employee_id is not None:
            body["ownerEmployeeId"] = owner_employee_id
        return ObjectiveDetail.from_json(self._t.request("POST", "/v1/performance/objectives", json=body))

    def get(self, objective_id: str) -> ObjectiveDetail:
        return ObjectiveDetail.from_json(self._t.request("GET", f"/v1/performance/objectives/{objective_id}"))


class _KeyResults:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def update(
        self, key_result_id: str, *, current_value: Optional[float] = None, confidence_score: Optional[float] = None
    ) -> KeyResult:
        body = {"currentValue": current_value, "confidenceScore": confidence_score}
        return KeyResult.from_json(self._t.request("PATCH", f"/v1/performance/key-results/{key_result_id}", json=body))


class _CheckIns:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def create(self, objective_id: str, *, note: str, confidence: float) -> CheckIn:
        body = {"note": note, "confidence": confidence}
        return CheckIn.from_json(self._t.request("POST", f"/v1/performance/objectives/{objective_id}/check-ins", json=body))


class _AppraisalCycles:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def list(self) -> List[AppraisalCycle]:
        return [AppraisalCycle.from_json(c) for c in self._t.request("GET", "/v1/performance/appraisal-cycles")]

    def create(self, *, name: str, opens_on: str, closes_on: str) -> AppraisalCycle:
        body = {"name": name, "opensOn": opens_on, "closesOn": closes_on}
        return AppraisalCycle.from_json(self._t.request("POST", "/v1/performance/appraisal-cycles", json=body))

    def reviews(self, cycle_id: str) -> List[AppraisalReview]:
        data = self._t.request("GET", f"/v1/performance/appraisal-cycles/{cycle_id}/reviews")
        return [AppraisalReview.from_json(r) for r in data]


class _Reviews:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def submit_self(self, review_id: str, *, body: str, rating: Optional[int] = None) -> AppraisalReview:
        payload = {"body": body, "rating": rating}
        return AppraisalReview.from_json(self._t.request("POST", f"/v1/performance/reviews/{review_id}/self", json=payload))

    def submit_manager(self, review_id: str, *, body: str, rating: Optional[int] = None) -> AppraisalReview:
        payload = {"body": body, "rating": rating}
        return AppraisalReview.from_json(self._t.request("POST", f"/v1/performance/reviews/{review_id}/manager", json=payload))


class _Promotions:
    def __init__(self, transport: _Transport) -> None:
        self._t = transport

    def list(self, employee_id: str) -> List[Promotion]:
        data = self._t.request("GET", f"/v1/performance/employees/{employee_id}/promotions")
        return [Promotion.from_json(p) for p in data]

    def create(
        self,
        *,
        employee_id: str,
        to_title: str,
        effective_date: str,
        from_title: Optional[str] = None,
        from_department_id: Optional[str] = None,
        to_department_id: Optional[str] = None,
        from_salary_minor: Optional[int] = None,
        to_salary_minor: Optional[int] = None,
        reason: Optional[str] = None,
    ) -> Promotion:
        body = {
            "employeeId": employee_id,
            "toTitle": to_title,
            "effectiveDate": effective_date,
            "fromTitle": from_title,
            "fromDepartmentId": from_department_id,
            "toDepartmentId": to_department_id,
            "fromSalaryMinor": from_salary_minor,
            "toSalaryMinor": to_salary_minor,
            "reason": reason,
        }
        return Promotion.from_json(self._t.request("POST", "/v1/performance/promotions", json=body))


class Performance:
    """The Performance add-on (OKRs, appraisals, promotions). Requires
    ``performance:read`` / ``performance:write``; Test keys cannot read or write these records."""

    def __init__(self, transport: _Transport) -> None:
        self.objectives = _Objectives(transport)
        self.key_results = _KeyResults(transport)
        self.check_ins = _CheckIns(transport)
        self.appraisal_cycles = _AppraisalCycles(transport)
        self.reviews = _Reviews(transport)
        self.promotions = _Promotions(transport)
