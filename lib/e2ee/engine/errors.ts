/**
 * Engine errors carry a stable code; the UI maps codes to copy (contract 12:
 * the engine never returns user-visible strings).
 */
type E2eeErrorCode =
  | "E2EE_NOT_READY"
  | "E2EE_UNSUPPORTED"
  | "E2EE_NO_CONVERSATION"
  | "E2EE_CONVERSATION_INACTIVE"
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
  | "E2EE_SIGNATURE_REJECTED"
  | "E2EE_LOGIN_GRANT_REJECTED"
  | "E2EE_DEVICE_MISMATCH"
  | "E2EE_ACCOUNT_MISMATCH"
  | "E2EE_COMMIT_FAILED"
  | "E2EE_DISPOSED";

export class E2eeError extends Error {
  readonly code: E2eeErrorCode;

  constructor(code: E2eeErrorCode, message?: string) {
    super(message ?? code);
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
