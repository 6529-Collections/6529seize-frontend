/**
 * Typed REST error. `status` 0 means the request never produced an HTTP
 * response (network failure); the outcome of a write is then unknown.
 */
export class E2eeApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly currentEpoch: number | null;
  readonly retryAfterMs: number;

  constructor(input: {
    message: string;
    status: number;
    code?: string | null;
    currentEpoch?: number | null;
    retryAfterMs?: number;
  }) {
    super(input.message);
    this.name = "E2eeApiError";
    this.status = input.status;
    this.code = input.code ?? null;
    this.currentEpoch = input.currentEpoch ?? null;
    this.retryAfterMs = input.retryAfterMs ?? 0;
  }
}

interface ErrorShape {
  readonly name?: unknown;
  readonly status?: unknown;
  readonly code?: unknown;
  readonly currentEpoch?: unknown;
  readonly retryAfterMs?: unknown;
}

/** Duck-typed so test doubles (and errors crossing realms) qualify. */
export function asE2eeApiError(error: unknown): E2eeApiError | null {
  if (error instanceof E2eeApiError) {
    return error;
  }
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const shape = error as ErrorShape;
  if (shape.name !== "E2eeApiError" || typeof shape.status !== "number") {
    return null;
  }
  return new E2eeApiError({
    message: error instanceof Error ? error.message : "E2EE API error",
    status: shape.status,
    code: typeof shape.code === "string" ? shape.code : null,
    retryAfterMs:
      typeof shape.retryAfterMs === "number" ? shape.retryAfterMs : 0,
    currentEpoch:
      typeof shape.currentEpoch === "number" ? shape.currentEpoch : null,
  });
}

export const e2eeErrorCode = (error: unknown): string | null =>
  asE2eeApiError(error)?.code ?? null;
