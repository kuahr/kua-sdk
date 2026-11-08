import type { HttpClient } from "../http.js";
import { requestExtras } from "../http.js";
import type {
  CreateEmployeeParams,
  EmployeeCreated,
  RequestOptions,
} from "../types.js";

export class Employees {
  constructor(private readonly http: HttpClient) {}

  /**
   * Add an employee to your company. Requires the `employees:write` scope.
   * Pass `idempotencyKey` to make retries safe.
   */
  create(
    params: CreateEmployeeParams,
    opts?: RequestOptions,
  ): Promise<EmployeeCreated> {
    return this.http.request<EmployeeCreated>("POST", "/v1/employees", {
      body: params,
      ...requestExtras(opts),
    });
  }
}
