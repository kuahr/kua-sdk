import type { HttpClient } from "../http.js";
import type { EventItem, ListEventsParams, RequestOptions } from "../types.js";

export class Events {
  constructor(private readonly http: HttpClient) {}

  /**
   * List Live company events; requires events:read. Test keys are unsupported. Poll incrementally with
   * the last event's exact `occurredAt` as `since` and `id` as `afterId`.
   * Since alone retains strict timestamp filtering.
   */
  list(
    params: ListEventsParams = {},
    opts?: RequestOptions,
  ): Promise<EventItem[]> {
    return this.http.request<EventItem[]>("GET", "/v1/events", {
      query: {
        since: params.since,
        afterId: params.afterId,
        eventType: params.eventType,
        limit: params.limit,
      },
      signal: opts?.signal,
    });
  }
}
