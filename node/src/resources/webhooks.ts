import type { HttpClient } from "../http.js";
import { requestExtras } from "../http.js";
import type {
  CreateWebhookParams,
  RequestOptions,
  WebhookCreated,
  WebhookHistory,
  WebhookReplayAccepted,
  ReplayWebhookParams,
  WebhookDeliveryItem,
  WebhookPingAccepted,
  WebhookSummary,
} from "../types.js";
import { verifySignature } from "../webhooks/verify.js";

export class Webhooks {
  constructor(private readonly http: HttpClient) {}

  /**
   * Register an endpoint to receive events. The response includes the signing
   * `secret` **once** — store it to verify signatures.
   */
  create(
    params: CreateWebhookParams,
    opts?: RequestOptions,
  ): Promise<WebhookCreated> {
    return this.http.request<WebhookCreated>("POST", "/v1/webhooks", {
      body: params,
      ...requestExtras(opts),
    });
  }

  /** List your registered webhook endpoints (without their secrets). */
  async list(opts?: RequestOptions): Promise<WebhookSummary[]> {
    const res = await this.http.request<{ webhooks: WebhookSummary[] }>(
      "GET",
      "/v1/webhooks",
      { signal: opts?.signal },
    );
    return res.webhooks;
  }

  /** Delete a webhook endpoint. Delivery stops immediately. */
  delete(id: string, opts?: RequestOptions): Promise<void> {
    return this.http.request<void>("DELETE", `/v1/webhooks/${id}`, {
      signal: opts?.signal,
    });
  }

  /** Recent delivery attempts for an endpoint. */
  async deliveries(
    id: string,
    params: { limit?: number } = {},
    opts?: RequestOptions,
  ): Promise<WebhookDeliveryItem[]> {
    const res = await this.http.request<{ deliveries: WebhookDeliveryItem[] }>(
      "GET",
      `/v1/webhooks/${id}/deliveries`,
      { query: { limit: params.limit }, signal: opts?.signal },
    );
    return res.deliveries;
  }

  /** Retained attempts and operator/API replay records for this delivery. Live keys: webhooks:read, webhooks:write, webhooks:replay or *. */
  history(endpointId: string, deliveryId: string, opts?: RequestOptions): Promise<WebhookHistory> {
    return this.http.request<WebhookHistory>("GET", `/v1/webhooks/${endpointId}/deliveries/${deliveryId}/history`, { signal: opts?.signal });
  }

  /** Queue one exhausted delivery. Keep params.requestKey and reason unchanged across ambiguous retries. */
  replay(endpointId: string, deliveryId: string, params: ReplayWebhookParams, opts?: RequestOptions): Promise<WebhookReplayAccepted> {
    return this.http.request<WebhookReplayAccepted>("POST", `/v1/webhooks/${endpointId}/deliveries/${deliveryId}/replay`, {
      body: params, ...requestExtras(opts),
    });
  }

  /** Send a test `webhook.ping` event to an endpoint. */
  ping(id: string, opts?: RequestOptions): Promise<WebhookPingAccepted> {
    return this.http.request<WebhookPingAccepted>(
      "POST",
      `/v1/webhooks/${id}/ping`,
      { signal: opts?.signal },
    );
  }

  /**
   * Verify the `X-Kua-Signature` header on an incoming webhook against your
   * endpoint's signing secret. See {@link verifySignature}.
   */
  verifySignature = verifySignature;
}
