import { KuaError } from "./errors.js";
import type { RequestOptions } from "./types.js";

export interface KuaConfig {
  /** Your API key, e.g. "kua_live_…" (or "kua_test_…" in test mode). */
  apiKey: string;
  /** Override the API base URL. Defaults to https://api.kuahr.com. */
  baseUrl?: string;
  /** Optional custom fetch (e.g. for tests). Defaults to global fetch. */
  fetch?: typeof fetch;
}

const DEFAULT_BASE_URL = "https://api.kuahr.com";
const CLIENT_VERSION = "0.3.0";

/** Internal HTTP transport: signs requests with the API key and maps errors. */
export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: KuaConfig) {
    if (!config.apiKey) throw new Error("Kua: `apiKey` is required.");
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    const f = config.fetch ?? globalThis.fetch;
    if (!f) {
      throw new Error(
        "Kua: no global `fetch` found. Use Node 18+ or pass a `fetch` implementation.",
      );
    }
    this.fetchImpl = f;
  }

  async request<T>(
    method: string,
    path: string,
    opts: {
      query?: Record<string, string | number | undefined>;
      body?: unknown;
      idempotencyKey?: string;
      signal?: AbortSignal;
    } = {},
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    const headers: Record<string, string> = {
      "X-Api-Key": this.apiKey,
      Accept: "application/json",
      "User-Agent": `kua-node/${CLIENT_VERSION}`,
    };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

    const res = await this.fetchImpl(url.toString(), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    const data = text ? safeJson(text) : undefined;

    if (!res.ok) {
      const code =
        (data as { code?: string } | undefined)?.code ?? `HTTP_${res.status}`;
      const message =
        (data as { message?: string } | undefined)?.message ??
        `Kua request failed with status ${res.status}.`;
      throw new KuaError(res.status, code, message);
    }

    return data as T;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function requestExtras(opts?: RequestOptions) {
  return { idempotencyKey: opts?.idempotencyKey, signal: opts?.signal };
}
