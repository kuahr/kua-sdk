import type { HttpClient } from "../http.js";
import { requestExtras } from "../http.js";
import type {
  AppraisalCycle,
  AppraisalReview,
  CheckIn,
  CreateCycleParams,
  CreateObjectiveParams,
  CreatePromotionParams,
  KeyResult,
  Objective,
  ObjectiveDetail,
  Promotion,
  RequestOptions,
  SubmitReviewParams,
  UpdateKeyResultParams,
} from "../types.js";

class Objectives {
  constructor(private readonly http: HttpClient) {}

  list(
    params: { cycleLabel?: string; ownerEmployeeId?: string } = {},
    opts?: RequestOptions,
  ): Promise<Objective[]> {
    return this.http.request<Objective[]>("GET", "/v1/performance/objectives", {
      query: { cycleLabel: params.cycleLabel, ownerEmployeeId: params.ownerEmployeeId },
      signal: opts?.signal,
    });
  }

  create(params: CreateObjectiveParams, opts?: RequestOptions): Promise<ObjectiveDetail> {
    return this.http.request<ObjectiveDetail>("POST", "/v1/performance/objectives", {
      body: params, ...requestExtras(opts),
    });
  }

  get(id: string, opts?: RequestOptions): Promise<ObjectiveDetail> {
    return this.http.request<ObjectiveDetail>("GET", `/v1/performance/objectives/${id}`, { signal: opts?.signal });
  }
}

class KeyResults {
  constructor(private readonly http: HttpClient) {}

  update(id: string, params: UpdateKeyResultParams, opts?: RequestOptions): Promise<KeyResult> {
    return this.http.request<KeyResult>("PATCH", `/v1/performance/key-results/${id}`, {
      body: params, ...requestExtras(opts),
    });
  }
}

class CheckIns {
  constructor(private readonly http: HttpClient) {}

  create(objectiveId: string, params: { note: string; confidence: number }, opts?: RequestOptions): Promise<CheckIn> {
    return this.http.request<CheckIn>("POST", `/v1/performance/objectives/${objectiveId}/check-ins`, {
      body: params, ...requestExtras(opts),
    });
  }
}

class AppraisalCycles {
  constructor(private readonly http: HttpClient) {}

  list(opts?: RequestOptions): Promise<AppraisalCycle[]> {
    return this.http.request<AppraisalCycle[]>("GET", "/v1/performance/appraisal-cycles", { signal: opts?.signal });
  }

  create(params: CreateCycleParams, opts?: RequestOptions): Promise<AppraisalCycle> {
    return this.http.request<AppraisalCycle>("POST", "/v1/performance/appraisal-cycles", {
      body: params, ...requestExtras(opts),
    });
  }

  reviews(cycleId: string, opts?: RequestOptions): Promise<AppraisalReview[]> {
    return this.http.request<AppraisalReview[]>("GET", `/v1/performance/appraisal-cycles/${cycleId}/reviews`, {
      signal: opts?.signal,
    });
  }
}

class Reviews {
  constructor(private readonly http: HttpClient) {}

  submitSelf(id: string, params: SubmitReviewParams, opts?: RequestOptions): Promise<AppraisalReview> {
    return this.http.request<AppraisalReview>("POST", `/v1/performance/reviews/${id}/self`, {
      body: params, ...requestExtras(opts),
    });
  }

  submitManager(id: string, params: SubmitReviewParams, opts?: RequestOptions): Promise<AppraisalReview> {
    return this.http.request<AppraisalReview>("POST", `/v1/performance/reviews/${id}/manager`, {
      body: params, ...requestExtras(opts),
    });
  }
}

class Promotions {
  constructor(private readonly http: HttpClient) {}

  list(employeeId: string, opts?: RequestOptions): Promise<Promotion[]> {
    return this.http.request<Promotion[]>("GET", `/v1/performance/employees/${employeeId}/promotions`, {
      signal: opts?.signal,
    });
  }

  create(params: CreatePromotionParams, opts?: RequestOptions): Promise<Promotion> {
    return this.http.request<Promotion>("POST", "/v1/performance/promotions", { body: params, ...requestExtras(opts) });
  }
}

/**
 * Performance APIs (OKRs, appraisals, promotions) require
 * `performance:read` / `performance:write`. Test keys cannot read or write these records.
 */
export class Performance {
  readonly objectives: Objectives;
  readonly keyResults: KeyResults;
  readonly checkIns: CheckIns;
  readonly appraisalCycles: AppraisalCycles;
  readonly reviews: Reviews;
  readonly promotions: Promotions;

  constructor(http: HttpClient) {
    this.objectives = new Objectives(http);
    this.keyResults = new KeyResults(http);
    this.checkIns = new CheckIns(http);
    this.appraisalCycles = new AppraisalCycles(http);
    this.reviews = new Reviews(http);
    this.promotions = new Promotions(http);
  }
}
