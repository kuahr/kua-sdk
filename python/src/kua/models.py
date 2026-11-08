"""Typed response models mirroring the public Kua /v1 API.

Each model is a frozen dataclass built from the JSON the API returns via
``from_json`` (unknown fields are ignored, so new API fields never break an
older SDK).
"""

from __future__ import annotations

from dataclasses import dataclass, fields, field
from typing import Any, Dict, List, Optional, Type, TypeVar

T = TypeVar("T", bound="_Model")


class _Model:
    @classmethod
    def from_json(cls: Type[T], data: Dict[str, Any]) -> T:
        known = {f.name for f in fields(cls)}  # type: ignore[arg-type]
        return cls(**{_snake(k): v for k, v in data.items() if _snake(k) in known})  # type: ignore[call-arg]


def _snake(name: str) -> str:
    out: List[str] = []
    for ch in name:
        if ch.isupper():
            out.append("_")
            out.append(ch.lower())
        else:
            out.append(ch)
    return "".join(out)


@dataclass(frozen=True)
class PayrollRunSummary(_Model):
    id: str
    year: int
    month: int
    status: str
    currency_iso_code: str
    hr_approved_at: Optional[str]
    disbursement_completed_at: Optional[str]


@dataclass(frozen=True)
class PayrollRunCreated(_Model):
    id: str
    year: int
    month: int
    status: str


@dataclass(frozen=True)
class EventItem(_Model):
    id: str
    occurred_at: str
    event_type: str
    aggregate_type: str
    aggregate_id: str
    payload: str


@dataclass(frozen=True)
class EmployeeCreated(_Model):
    id: str
    first_name: str
    last_name: str
    email: str


@dataclass(frozen=True)
class TestDataCleared(_Model):
    purged: int


@dataclass(frozen=True)
class WebhookCreated(_Model):
    id: str
    url: str
    description: Optional[str]
    event_types: str
    is_active: bool
    secret: str


@dataclass(frozen=True)
class WebhookSummary(_Model):
    id: str
    url: str
    description: Optional[str]
    event_types: str
    is_active: bool
    created_at: str


@dataclass(frozen=True)
class WebhookDeliveryItem(_Model):
    id: str
    event_type: str
    status: str
    attempts: int
    response_status_code: Optional[int]
    last_attempt_at: Optional[str]
    next_attempt_at: str
    error: Optional[str]
    created_at: str
    domain_event_id: Optional[str] = None
    max_attempts: Optional[int] = None


@dataclass(frozen=True)
class WebhookPingAccepted(_Model):
    delivery_id: str
    status: str


# ---- Add-on: Leave ----


@dataclass(frozen=True)
class LeaveType(_Model):
    id: str
    name: str
    default_days_per_year: int
    is_paid: bool
    max_carryover_days: int
    gender_restriction: str
    is_active: bool
    created_at: str


@dataclass(frozen=True)
class LeaveRequest(_Model):
    id: str
    employee_id: str
    employee_name: Optional[str]
    leave_type_id: str
    leave_type_name: Optional[str]
    start_date: str
    end_date: str
    working_days: int
    reason: str
    status: str
    decision_comment: Optional[str]
    decided_at: Optional[str]
    created_at: str


@dataclass(frozen=True)
class LeaveBalance(_Model):
    employee_id: str
    leave_type_id: str
    year: int
    total_days: int
    days_used: int
    days_pending: int
    days_available: int


@dataclass(frozen=True)
class LeaveAllocation(_Model):
    id: str
    employee_id: str
    leave_type_id: str
    year: int
    total_days: int
    note: Optional[str]
    created_at: str


# ---- Add-on: Salary advance ----


@dataclass(frozen=True)
class Advance(_Model):
    id: str
    employee_id: str
    amount_minor: int
    total_repayable_minor: int
    currency_iso_code: str
    term_months: int
    status: str
    disbursed_at: Optional[str]
    created_at: str


# ---- Add-on: Performance ----


@dataclass(frozen=True)
class Objective(_Model):
    id: str
    owner_employee_id: str
    title: str
    description: Optional[str]
    cycle_label: str
    cycle_start: str
    cycle_end: str
    status: str
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class KeyResult(_Model):
    id: str
    objective_id: str
    description: str
    target_value: float
    current_value: float
    unit: str
    confidence_score: float


@dataclass(frozen=True)
class CheckIn(_Model):
    id: str
    objective_id: str
    author_employee_id: str
    note: str
    confidence: float
    created_at: str


@dataclass(frozen=True)
class ObjectiveDetail:
    objective: Objective
    key_results: List["KeyResult"]
    check_ins: List["CheckIn"]

    @classmethod
    def from_json(cls, data: Dict[str, Any]) -> "ObjectiveDetail":
        return cls(
            objective=Objective.from_json(data["objective"]),
            key_results=[KeyResult.from_json(k) for k in data.get("keyResults", [])],
            check_ins=[CheckIn.from_json(c) for c in data.get("checkIns", [])],
        )


@dataclass(frozen=True)
class AppraisalCycle(_Model):
    id: str
    name: str
    opens_on: str
    closes_on: str
    status: str
    created_at: str


@dataclass(frozen=True)
class AppraisalReview(_Model):
    id: str
    cycle_id: str
    employee_id: str
    employee_name: Optional[str]
    manager_reviewer_id: Optional[str]
    manager_name: Optional[str]
    status: str
    self_review_body: Optional[str]
    self_review_submitted_at: Optional[str]
    manager_review_body: Optional[str]
    manager_review_submitted_at: Optional[str]
    overall_rating: Optional[int]
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class Promotion(_Model):
    id: str
    employee_id: str
    from_title: Optional[str]
    to_title: str
    from_department_id: Optional[str]
    to_department_id: Optional[str]
    from_salary_minor: Optional[int]
    to_salary_minor: Optional[int]
    effective_date: str
    reason: Optional[str]
    created_at: str


@dataclass(frozen=True)
class WebhookReplayAccepted(_Model):
    """Queued only; this does not confirm receiver delivery."""
    replay_id: str
    delivery_id: str
    status: str
    message: str


@dataclass(frozen=True)
class WebhookDeliveryAttempt(_Model):
    id: str
    attempt_number: int
    outcome: str
    delivery_id: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    response_status_code: Optional[int] = None
    error: Optional[str] = None


@dataclass(frozen=True)
class WebhookReplayRecord(_Model):
    id: str
    reason: str
    prior_attempts: int
    requested_at: str
    requested_by_user_id: Optional[str] = None
    api_key_id: Optional[str] = None
    operator_recovery: bool = False
    prior_error: Optional[str] = None


@dataclass(frozen=True)
class WebhookHistory(_Model):
    attempts: List[WebhookDeliveryAttempt] = field(default_factory=list)
    replays: List[WebhookReplayRecord] = field(default_factory=list)

    @classmethod
    def from_json(cls, data: Dict[str, Any]) -> WebhookHistory:
        return cls(
            attempts=[WebhookDeliveryAttempt.from_json(a) for a in data.get("attempts", [])],
            replays=[WebhookReplayRecord.from_json(r) for r in data.get("replays", [])],
        )
