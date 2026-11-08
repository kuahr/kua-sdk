import type { HttpClient } from "../http.js";
import { requestExtras } from "../http.js";
import type {
  CreateLeaveRequestParams,
  CreateLeaveTypeParams,
  GrantAllocationParams,
  LeaveAllocation,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  ListLeaveRequestsParams,
  RequestOptions,
} from "../types.js";

/**
 * Leave APIs require `leave:read` / `leave:write`. Test keys cannot read or
 * write unpartitioned leave records; scopes do not replace eligibility.
 */
export class Leave {
  constructor(private readonly http: HttpClient) {}

  /** List the company's leave types. */
  listTypes(opts?: RequestOptions): Promise<LeaveType[]> {
    return this.http.request<LeaveType[]>("GET", "/v1/leave/types", { signal: opts?.signal });
  }

  /** Create a leave type. */
  createType(params: CreateLeaveTypeParams, opts?: RequestOptions): Promise<LeaveType> {
    return this.http.request<LeaveType>("POST", "/v1/leave/types", { body: params, ...requestExtras(opts) });
  }

  /** List leave requests, optionally filtered by status and/or employee. */
  listRequests(params: ListLeaveRequestsParams = {}, opts?: RequestOptions): Promise<LeaveRequest[]> {
    return this.http.request<LeaveRequest[]>("GET", "/v1/leave/requests", {
      query: { status: params.status, employeeId: params.employeeId },
      signal: opts?.signal,
    });
  }

  /** Submit a leave request for an employee. */
  createRequest(params: CreateLeaveRequestParams, opts?: RequestOptions): Promise<LeaveRequest> {
    return this.http.request<LeaveRequest>("POST", "/v1/leave/requests", { body: params, ...requestExtras(opts) });
  }

  /** Approve a submitted request. */
  approveRequest(id: string, comment?: string, opts?: RequestOptions): Promise<LeaveRequest> {
    return this.http.request<LeaveRequest>("POST", `/v1/leave/requests/${id}/approve`, {
      body: { comment }, ...requestExtras(opts),
    });
  }

  /** Reject a submitted request (a comment is required). */
  rejectRequest(id: string, comment: string, opts?: RequestOptions): Promise<LeaveRequest> {
    return this.http.request<LeaveRequest>("POST", `/v1/leave/requests/${id}/reject`, {
      body: { comment }, ...requestExtras(opts),
    });
  }

  /** Cancel a request. */
  cancelRequest(id: string, opts?: RequestOptions): Promise<LeaveRequest> {
    return this.http.request<LeaveRequest>("POST", `/v1/leave/requests/${id}/cancel`, { ...requestExtras(opts) });
  }

  /** An employee's balance per active leave type (defaults to the current year). */
  balances(
    params: { employeeId: string; year?: number },
    opts?: RequestOptions,
  ): Promise<LeaveBalance[]> {
    return this.http.request<LeaveBalance[]>("GET", "/v1/leave/balances", {
      query: { employeeId: params.employeeId, year: params.year },
      signal: opts?.signal,
    });
  }

  /** Grant an employee a number of days of a leave type for a year. */
  grantAllocation(params: GrantAllocationParams, opts?: RequestOptions): Promise<LeaveAllocation> {
    return this.http.request<LeaveAllocation>("POST", "/v1/leave/allocations", { body: params, ...requestExtras(opts) });
  }
}
