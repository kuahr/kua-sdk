// Response + request shapes for the public Kua /v1 API. These mirror the
// OpenAPI document at https://api.kuahr.com/openapi/v1.json.

export interface PayrollRunSummary {
  id: string;
  year: number;
  month: number;
  /** e.g. "Draft", "HrApproved", "Disbursed". */
  status: string;
  /** ISO-4217 currency code, e.g. "NGN". */
  currencyIsoCode: string;
  /** Null until HR approves. */
  hrApprovedAt: string | null;
  /** Null until disbursement settles. */
  disbursementCompletedAt: string | null;
}

export interface PayrollRunCreated {
  id: string;
  year: number;
  month: number;
  status: string;
}

export interface EventItem {
  id: string;
  occurredAt: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  /** Event-specific fields, as a JSON-encoded string. */
  payload: string;
}

export interface EmployeeCreated {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TestDataCleared {
  purged: number;
}

export interface WebhookCreated {
  id: string;
  url: string;
  description: string | null;
  eventTypes: string;
  isActive: boolean;
  /** The signing secret ("whsec_…"). Present only on creation — store it now. */
  secret: string;
}

export interface WebhookSummary {
  id: string;
  url: string;
  description: string | null;
  eventTypes: string;
  isActive: boolean;
  createdAt: string;
}

export interface WebhookDeliveryItem {
  id: string;
  domainEventId: string;
  maxAttempts: number;
  eventType: string;
  status: string;
  attempts: number;
  responseStatusCode: number | null;
  lastAttemptAt: string | null;
  nextAttemptAt: string;
  error: string | null;
  createdAt: string;
}

export interface WebhookPingAccepted {
  deliveryId: string;
  status: string;
}

// ---- Request inputs ----

export interface CreateEmployeeParams {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  jobTitle?: string;
  employmentTypeId: string;
  /** ISO date, e.g. "2026-07-01". */
  employedAt: string;
}

export interface CreatePayrollRunParams {
  year: number;
  month: number;
}

export interface CreateWebhookParams {
  url: string;
  description?: string;
  /** Comma-separated event types, or "*" for all. Defaults to "*". */
  eventTypes?: string;
}

export interface ListEventsParams {
  /** Exact returned occurredAt; alone, returns events strictly after this timestamp. */
  since?: string;
  /** Last returned event ID; requires since for exclusive (occurredAt, id) continuation. */
  afterId?: string;
  eventType?: string;
  /** 1–500, default 100. */
  limit?: number;
}

/** Per-request options. Supply an idempotency key to make retries of a write safe. */
export interface RequestOptions {
  idempotencyKey?: string;
  signal?: AbortSignal;
}

// ---- Add-on: Leave (leave:read / leave:write scopes; Live-only) ----

export interface LeaveType {
  id: string;
  name: string;
  defaultDaysPerYear: number;
  isPaid: boolean;
  maxCarryoverDays: number;
  /** "Anyone" | "FemaleOnly" | "MaleOnly". */
  genderRestriction: string;
  isActive: boolean;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string | null;
  leaveTypeId: string;
  leaveTypeName: string | null;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  /** "Submitted" | "Approved" | "Rejected" | "Cancelled". */
  status: string;
  decisionComment: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  daysUsed: number;
  daysPending: number;
  daysAvailable: number;
}

export interface LeaveAllocation {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  note: string | null;
  createdAt: string;
}

export interface CreateLeaveTypeParams {
  name: string;
  defaultDaysPerYear: number;
  isPaid: boolean;
  maxCarryoverDays: number;
  /** Defaults to "Anyone". */
  genderRestriction?: "Anyone" | "FemaleOnly" | "MaleOnly";
}

export interface CreateLeaveRequestParams {
  employeeId: string;
  leaveTypeId: string;
  /** ISO date, e.g. "2026-08-03". */
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ListLeaveRequestsParams {
  status?: "Submitted" | "Approved" | "Rejected" | "Cancelled";
  employeeId?: string;
}

export interface GrantAllocationParams {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  note?: string;
}

// ---- Add-on: Salary advance (requires the add-on + advances:* scopes) ----

export interface Advance {
  id: string;
  employeeId: string;
  /** Principal, in minor units (e.g. kobo). */
  amountMinor: number;
  totalRepayableMinor: number;
  currencyIsoCode: string;
  termMonths: number;
  /** "Pending" | "Active" | "Repaid" | "Defaulted" | "Cancelled". */
  status: string;
  disbursedAt: string | null;
  createdAt: string;
}

export interface RequestAdvanceParams {
  employeeId: string;
  amountMinor: number;
  termMonths: number;
}

// ---- Add-on: Performance (requires the Performance add-on + performance:* scopes) ----

export interface Objective {
  id: string;
  ownerEmployeeId: string;
  title: string;
  description: string | null;
  cycleLabel: string;
  cycleStart: string;
  cycleEnd: string;
  /** "Active" | "Completed" | "Abandoned". */
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeyResult {
  id: string;
  objectiveId: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  /** 0.0–1.0. */
  confidenceScore: number;
}

export interface CheckIn {
  id: string;
  objectiveId: string;
  authorEmployeeId: string;
  note: string;
  confidence: number;
  createdAt: string;
}

export interface ObjectiveDetail {
  objective: Objective;
  keyResults: KeyResult[];
  checkIns: CheckIn[];
}

export interface AppraisalCycle {
  id: string;
  name: string;
  opensOn: string;
  closesOn: string;
  /** "Open" | "Closed" | "Cancelled". */
  status: string;
  createdAt: string;
}

export interface AppraisalReview {
  id: string;
  cycleId: string;
  employeeId: string;
  employeeName: string | null;
  managerReviewerId: string | null;
  managerName: string | null;
  /** "PendingSelf" | "PendingManager" | "Complete". */
  status: string;
  selfReviewBody: string | null;
  selfReviewSubmittedAt: string | null;
  managerReviewBody: string | null;
  managerReviewSubmittedAt: string | null;
  overallRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  employeeId: string;
  fromTitle: string | null;
  toTitle: string;
  fromDepartmentId: string | null;
  toDepartmentId: string | null;
  fromSalaryMinor: number | null;
  toSalaryMinor: number | null;
  effectiveDate: string;
  reason: string | null;
  createdAt: string;
}

export interface KeyResultSpec {
  description: string;
  targetValue: number;
  unit: string;
}

export interface CreateObjectiveParams {
  title: string;
  description?: string;
  cycleLabel: string;
  cycleStart: string;
  cycleEnd: string;
  ownerEmployeeId?: string;
  keyResults: KeyResultSpec[];
}

export interface UpdateKeyResultParams {
  currentValue?: number;
  confidenceScore?: number;
}

export interface CreateCycleParams {
  name: string;
  opensOn: string;
  closesOn: string;
}

export interface SubmitReviewParams {
  body: string;
  rating?: number;
}

export interface CreatePromotionParams {
  employeeId: string;
  toTitle: string;
  fromTitle?: string;
  fromDepartmentId?: string;
  toDepartmentId?: string;
  fromSalaryMinor?: number;
  toSalaryMinor?: number;
  effectiveDate: string;
  reason?: string;
}

/** Successful replay acceptance means queued, not receiver delivery. */
export interface WebhookReplayAccepted {
  replayId: string; deliveryId: string; status: "Pending"; message: string;
}
export interface ReplayWebhookParams {
  /** Stable logical request key, max 100 characters. Retain after a lost response. */
  requestKey: string;
  /** Receiver repair/recovery reason, 3–1000 characters. */
  reason: string;
}
export interface WebhookDeliveryAttempt {
  id: string; deliveryId: string; attemptNumber: number; startedAt: string; completedAt: string | null;
  outcome: string; responseStatusCode: number | null; error: string | null;
}
export interface WebhookReplayRecord {
  id: string; reason: string; requestedByUserId: string; apiKeyId: string | null; operatorRecovery: boolean;
  priorAttempts: number; priorError: string | null; requestedAt: string;
}
export interface WebhookHistory {
  attempts: WebhookDeliveryAttempt[]; replays: WebhookReplayRecord[];
}
