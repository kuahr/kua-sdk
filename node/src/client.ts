import { HttpClient, type KuaConfig } from "./http.js";
import { Advances } from "./resources/advances.js";
import { Employees } from "./resources/employees.js";
import { Events } from "./resources/events.js";
import { Leave } from "./resources/leave.js";
import { PayrollRuns } from "./resources/payroll-runs.js";
import { Performance } from "./resources/performance.js";
import { TestData } from "./resources/test-data.js";
import { Webhooks } from "./resources/webhooks.js";

/**
 * The Kua API client.
 *
 * ```ts
 * import { Kua } from "@kua/node";
 * const kua = new Kua({ apiKey: process.env.KUA_API_KEY! });
 * const runs = await kua.payrollRuns.list();
 * ```
 */
export class Kua {
  readonly payrollRuns: PayrollRuns;
  readonly employees: Employees;
  readonly events: Events;
  readonly webhooks: Webhooks;
  readonly testData: TestData;
  readonly leave: Leave;
  readonly advances: Advances;
  readonly performance: Performance;

  constructor(config: KuaConfig) {
    const http = new HttpClient(config);
    this.payrollRuns = new PayrollRuns(http);
    this.employees = new Employees(http);
    this.events = new Events(http);
    this.webhooks = new Webhooks(http);
    this.testData = new TestData(http);
    this.leave = new Leave(http);
    this.advances = new Advances(http);
    this.performance = new Performance(http);
  }
}
