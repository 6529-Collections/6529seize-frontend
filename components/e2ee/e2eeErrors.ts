import type { MessageKey } from "@/i18n/messages";
import { E2EE_SIGNATURE_REJECTED } from "@/lib/e2ee/engine/errors";

export {
  E2EE_SIGNATURE_REJECTED,
  isE2eeSignatureRejection,
} from "@/lib/e2ee/engine/errors";

/**
 * Normalized rejection thrown to the engine, keeping the wallet's rejection
 * shape (name and EIP-1193 code 4001) so either side can detect it.
 */
export function createE2eeSignatureRejectedError(cause: unknown): Error {
  const error = new Error(E2EE_SIGNATURE_REJECTED, { cause });
  error.name = "UserRejectedRequestError";
  return Object.assign(error, { code: 4001 });
}

/** Stable engine/API code from an unknown error, if it carries one. */
export function getE2eeErrorCode(error: unknown): string | null {
  if (error === null || typeof error !== "object") {
    return null;
  }
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof code === "string" && code.startsWith("E2EE_")) {
    return code;
  }
  if (typeof message === "string" && /^E2EE_[A-Z_]+$/.test(message)) {
    return message;
  }
  return null;
}

const ACTION_ERROR_KEYS: Readonly<Record<string, MessageKey>> = {
  E2EE_POLICY: "e2ee.new.eligibility.POLICY",
  E2EE_BLOCKED: "e2ee.new.eligibility.BLOCKED",
  E2EE_NO_DEVICES: "e2ee.new.eligibility.NO_DEVICES",
  E2EE_DEVICE_LIMIT: "e2ee.deviceLimit.title",
  E2EE_CONVERSATION_INACTIVE: "e2ee.composer.unavailable",
  E2EE_SUPERSEDED: "e2ee.superseded.announce",
  E2EE_ATTACHMENTS_DISABLED: "e2ee.composer.attachmentsUnavailable",
};

/** Copy for an action failure; falls back to the given generic key. */
export function getE2eeActionErrorKey(
  error: unknown,
  fallback: MessageKey
): MessageKey {
  const code = getE2eeErrorCode(error);
  return (code ? ACTION_ERROR_KEYS[code] : undefined) ?? fallback;
}
