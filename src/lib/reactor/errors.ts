/** Canonical runtime registry for normalized Reactor error identifiers. */
export const REACTOR_ERROR_CODES = {
  REACTOR_AUTH_FAILED: "REACTOR_AUTH_FAILED",
  REACTOR_MODEL_UNSUPPORTED: "REACTOR_MODEL_UNSUPPORTED",
  REACTOR_SESSION_LIMIT: "REACTOR_SESSION_LIMIT",
  REACTOR_SESSION_EXPIRED: "REACTOR_SESSION_EXPIRED",
  REACTOR_CONNECTION_FAILED: "REACTOR_CONNECTION_FAILED",
  REACTOR_COMMAND_REJECTED: "REACTOR_COMMAND_REJECTED",
  REACTOR_UPLOAD_FAILED: "REACTOR_UPLOAD_FAILED",
  REACTOR_GENERATION_FAILED: "REACTOR_GENERATION_FAILED",
  REACTOR_UPSTREAM_UNAVAILABLE: "REACTOR_UPSTREAM_UNAVAILABLE",
  REACTOR_INVALID_SESSION: "REACTOR_INVALID_SESSION",
} as const;

export type ReactorErrorCode = (typeof REACTOR_ERROR_CODES)[keyof typeof REACTOR_ERROR_CODES];

export class ReactorError extends Error {
  readonly code: ReactorErrorCode;
  readonly status: number;

  constructor(code: ReactorErrorCode, message: string, status = 500) {
    super(message);
    this.name = "ReactorError";
    this.code = code;
    this.status = status;
  }
}

export function normalizeReactorUpstreamError(status: number): ReactorError {
  if (status === 401 || status === 403) {
    return new ReactorError("REACTOR_AUTH_FAILED", "Reactor authentication failed", 502);
  }
  if (status === 409 || status === 429) {
    return new ReactorError("REACTOR_SESSION_LIMIT", "Reactor session limit reached", 429);
  }
  if (status >= 500) {
    return new ReactorError("REACTOR_UPSTREAM_UNAVAILABLE", "Reactor upstream is unavailable", 503);
  }
  return new ReactorError("REACTOR_CONNECTION_FAILED", "Reactor request failed", 502);
}
