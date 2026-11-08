import type { HttpClient } from "../http.js";
import type { RequestOptions, TestDataCleared } from "../types.js";

export class TestData {
  constructor(private readonly http: HttpClient) {}

  /**
   * Delete all of this company's test-mode data now (it also auto-purges after
   * 14 days). Requires test-data:clear; either key mode clears only this company’s
   * Test data. Live/foreign records are never affected.
   */
  clear(opts?: RequestOptions): Promise<TestDataCleared> {
    return this.http.request<TestDataCleared>("POST", "/v1/test-data/clear", {
      signal: opts?.signal,
    });
  }
}
