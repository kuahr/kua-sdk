/**
 * Thrown when the Kua API returns a non-2xx response. `code` is the stable,
 * machine-readable identifier you can branch on (e.g. "INSUFFICIENT_SCOPE");
 * `status` is the HTTP status.
 */
export class KuaError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "KuaError";
    this.status = status;
    this.code = code;
  }
}
