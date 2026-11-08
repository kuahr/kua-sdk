import crypto from "node:crypto";

export interface VerifyOptions {
  /**
   * Reject deliveries whose timestamp is older than this many seconds, to guard
   * against replays. Set to 0 to disable the check. Default: 300 (5 minutes).
   */
  toleranceSeconds?: number;
}

/**
 * Verify the `X-Kua-Signature` header on an incoming webhook.
 *
 * Kua signs `HMAC-SHA256(secret, "{t}.{rawBody}")` and sends it as
 * `X-Kua-Signature: t={unix_seconds},v1={hex}`. Verify against the **raw**
 * request body (the exact bytes received), before any JSON parsing.
 *
 * @param rawBody  The raw request body, exactly as received.
 * @param header   The value of the `X-Kua-Signature` header.
 * @param secret   Your endpoint's signing secret ("whsec_…").
 * @returns `true` if the signature is valid (and, if enabled, fresh).
 */
export function verifySignature(
  rawBody: string | Buffer,
  header: string | null | undefined,
  secret: string,
  options: VerifyOptions = {},
): boolean {
  if (!header) return false;

  const parts: Record<string, string> = {};
  for (const kv of header.split(",")) {
    const idx = kv.indexOf("=");
    if (idx === -1) continue;
    parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim();
  }

  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  const tolerance = options.toleranceSeconds ?? 300;
  if (tolerance > 0) {
    const ts = Number(t);
    if (!Number.isFinite(ts)) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - ts) > tolerance) return false;
  }

  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${body}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
