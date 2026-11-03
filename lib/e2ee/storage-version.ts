class E2eeStateConflictError extends Error {
  readonly code = "E2EE_STATE_CONFLICT";

  constructor() {
    super("E2EE_STATE_CONFLICT");
    this.name = "E2eeStateConflictError";
  }
}

export const isE2eeStateConflict = (error: unknown): boolean =>
  error instanceof E2eeStateConflictError;

/** The version a write stores; throws on a failed compare-and-swap. */
export function nextVersion(
  stored: number,
  expectedVersion: number | undefined,
  bump: boolean
): number {
  if (expectedVersion === undefined) {
    return bump ? stored + 1 : stored;
  }
  if (stored !== expectedVersion) {
    throw new E2eeStateConflictError();
  }
  return expectedVersion + 1;
}
