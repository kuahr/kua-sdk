import type { HttpClient } from "../http.js";
import { requestExtras } from "../http.js";
import type {
  CreatePayrollRunParams,
  PayrollRunCreated,
  PayrollRunSummary,
  RequestOptions,
} from "../types.js";

export class PayrollRuns {
  constructor(private readonly http: HttpClient) {}

  /** List this key's Live/Test payroll runs; requires payroll:read. */
  list(opts?: RequestOptions): Promise<PayrollRunSummary[]> {
    return this.http.request<PayrollRunSummary[]>("GET", "/v1/payroll/runs", {
      signal: opts?.signal,
    });
  }

  /**
   * Create a draft payroll run for the given month from the current roster.
   * Requires the `payroll:write` scope.
   */
  create(
    params: CreatePayrollRunParams,
    opts?: RequestOptions,
  ): Promise<PayrollRunCreated> {
    return this.http.request<PayrollRunCreated>("POST", "/v1/payroll/runs", {
      body: params,
      ...requestExtras(opts),
    });
  }
}
