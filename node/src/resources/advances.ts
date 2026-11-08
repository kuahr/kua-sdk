import type { HttpClient } from "../http.js";
import { requestExtras } from "../http.js";
import type { Advance, RequestAdvanceParams, RequestOptions } from "../types.js";

/**
 * Salary advance APIs require `advances:read` / `advances:write`. Test keys
 * cannot read or write unpartitioned advance records. **Approving disburses
 * real money** — not available with a test-mode key.
 */
export class Advances {
  constructor(private readonly http: HttpClient) {}

  /** List the company's advances, optionally filtered by employee. */
  list(params: { employeeId?: string } = {}, opts?: RequestOptions): Promise<Advance[]> {
    return this.http.request<Advance[]>("GET", "/v1/advances", {
      query: { employeeId: params.employeeId },
      signal: opts?.signal,
    });
  }

  /** Request an advance for an employee (starts Pending). */
  request(params: RequestAdvanceParams, opts?: RequestOptions): Promise<Advance> {
    return this.http.request<Advance>("POST", "/v1/advances", { body: params, ...requestExtras(opts) });
  }

  /** Approve a pending advance — **this disburses funds**. */
  approve(id: string, opts?: RequestOptions): Promise<Advance> {
    return this.http.request<Advance>("POST", `/v1/advances/${id}/approve`, { ...requestExtras(opts) });
  }

  /** Reject a pending advance. */
  reject(id: string, opts?: RequestOptions): Promise<Advance> {
    return this.http.request<Advance>("POST", `/v1/advances/${id}/reject`, { ...requestExtras(opts) });
  }
}
