"""Official Python client for the Kua API."""

from __future__ import annotations

from .client import Kua
from .errors import KuaError
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
    WebhookDeliveryAttempt,
    WebhookReplayRecord,
    WebhookDeliveryItem,
    WebhookPingAccepted,
    WebhookSummary,
)
from .webhooks_verify import verify_signature

__version__ = "0.3.0"

__all__ = [
    "Kua",
    "KuaError",
    "verify_signature",
    "PayrollRunSummary",
    "PayrollRunCreated",
    "EventItem",
    "EmployeeCreated",
    "TestDataCleared",
    "WebhookCreated",
    "WebhookHistory",
    "WebhookReplayAccepted",
    "WebhookDeliveryAttempt",
    "WebhookReplayRecord",
    "WebhookSummary",
    "WebhookDeliveryItem",
    "WebhookPingAccepted",
    "LeaveType",
    "LeaveRequest",
    "LeaveBalance",
    "LeaveAllocation",
    "Advance",
    "Objective",
    "KeyResult",
    "CheckIn",
    "ObjectiveDetail",
    "AppraisalCycle",
    "AppraisalReview",
    "Promotion",
]
