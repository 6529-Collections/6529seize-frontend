/** Code used when the user declines the device-grant wallet signature. */
export const E2EE_SIGNATURE_REJECTED = "E2EE_SIGNATURE_REJECTED";

interface ErrorLike {
  readonly name?: unknown;
  readonly code?: unknown;
  readonly message?: unknown;
  readonly cause?: unknown;
}

const MAX_CAUSE_DEPTH = 5;

const isRejectionShape = (value: ErrorLike): boolean =>
  value.name === "UserRejectedRequestError" ||
  value.code === 4001 ||
  value.code === "4001" ||
  value.code === E2EE_SIGNATURE_REJECTED ||
  value.message === E2EE_SIGNATURE_REJECTED;

/** True for a wallet "user rejected" error, possibly wrapped in causes. */
export function isE2eeSignatureRejection(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (current === null || typeof current !== "object") {
      return false;
    }
    const value = current as ErrorLike;
    if (isRejectionShape(value)) {
      return true;
    }
    current = value.cause;
  }
  return false;
}

/**
 * Engine errors carry a stable code; the UI maps codes to copy (contract 12:
 * the engine never returns user-visible strings).
 */
type E2eeErrorCode =
  | "E2EE_NOT_READY"
  | "E2EE_UNSUPPORTED"
  | "E2EE_NO_CONVERSATION"
  | "E2EE_CONVERSATION_INACTIVE"
  | "E2EE_SUPERSEDED"
  | "E2EE_NOT_ADMIN"
  | "E2EE_NOT_ALLOWED"
  | "E2EE_DM_TARGET"
  | "E2EE_POLICY"
  | "E2EE_BLOCKED"
  | "E2EE_NO_DEVICES"
  | "E2EE_NO_MESSAGE"
  | "E2EE_NOT_SENDER"
  | "E2EE_REPORT_UNAVAILABLE"
  | "E2EE_NO_ATTACHMENT"
  | "E2EE_ATTACHMENTS_DISABLED"
  | "E2EE_INVALID_INPUT"
  | "E2EE_DEVICE_LIMIT"
  | typeof E2EE_SIGNATURE_REJECTED
  | "E2EE_SIGNATURE_FAILED"
  | "E2EE_LOGIN_GRANT_REJECTED"
  | "E2EE_DEVICE_MISMATCH"
  | "E2EE_ACCOUNT_MISMATCH"
  | "E2EE_COMMIT_FAILED"
  | "E2EE_DISPOSED";

export class E2eeError extends Error {
  readonly code: E2eeErrorCode;

  constructor(code: E2eeErrorCode, message?: string, options?: ErrorOptions) {
    super(message ?? code, options);
    this.name = "E2eeError";
    this.code = code;
  }
}

/** A failure that should pause processing and retry later (network). */
export class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}

export const errorMessage = (error: unknown): string => {
  if (error instanceof E2eeError) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "E2EE_UNKNOWN";
};
