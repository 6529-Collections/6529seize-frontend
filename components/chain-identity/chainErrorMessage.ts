import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { ChainGatewayError } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";

/**
 * The 6529 Network's refusals in plain words, by the result code's name
 * that the gateway and the chain report. Anything else keeps its message.
 */
const KNOWN_CODES = [
  "HANDLE_TAKEN",
  "HANDLE_RESERVED",
  "INSUFFICIENT_BALANCE",
  "FEE_UNCOVERED",
  "FEE_ALLOWANCE_SPENT",
  "OVER_GRANT_BUDGET",
  "GRANT_INACTIVE",
  "GRANT_NOT_LIVE",
  "ADDRESS_BOUND",
  "REJOIN_WAIT",
  "IDENTITY_FULL",
  "LAST_WALLET",
  "IMPORT_RUNNING",
  "STALE_VERSION",
  "EXPIRED",
  "NONCE",
] as const;

const USER_REJECTION = /user (rejected|denied)/i;

const isUserRejection = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const { name, code, message } = error as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
  };
  return (
    name === "UserRejectedRequestError" ||
    code === 4001 ||
    (typeof message === "string" && USER_REJECTION.test(message))
  );
};

/** The reason to show, or null when the person declined in the wallet. */
export function chainErrorMessage(
  locale: SupportedLocale,
  error: unknown
): string | null {
  if (isUserRejection(error)) {
    return null;
  }
  if (error instanceof ChainGatewayError && error.status === 0) {
    return t(locale, "chainIdentity.error.noGateway");
  }
  if (
    error instanceof ChainGatewayError ||
    error instanceof ChainOperationError
  ) {
    const known = KNOWN_CODES.find((code) => error.message.includes(code));
    return known
      ? t(locale, `chainIdentity.error.${known}` as MessageKey)
      : error.message;
  }
  return t(locale, "chainIdentity.error.generic");
}
