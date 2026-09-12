import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US";
import {
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";

const DETAILS_MESSAGE = "collect.error.prepareDetails";
const SERVICE_MESSAGE = "collect.error.prepareService";
const UNSUPPORTED_MESSAGE = "collect.error.prepareUnsupported";

const LOCAL_ERRORS = new Map<string, MessageKey>([
  ["MARKET_REVIEW_MISMATCH", "collect.trade.checkFailed"],
  ["MARKET_CONNECTION_CHANGED", "collect.error.prepareConnectionChanged"],
  ["MARKET_FIXED_ORDER_CHANGED", "collect.trade.exactOrderChanged"],
  ["MARKET_OFFER_LIMIT_EXCEEDED", "collect.error.offerLimit"],
  ["MARKET_OFFER_QUANTITY_CHANGED", "collect.error.offerQuantity"],
  ["MARKET_RECOVERY_STORAGE_UNAVAILABLE", "collect.trade.storageUnavailable"],
  ["MARKET_EXECUTION_LOCK_UNAVAILABLE", "collect.trade.lockUnavailable"],
  ["MARKET_EXECUTION_ALREADY_ACTIVE", "collect.trade.lockActive"],
  ["MARKET_BROADCAST_UNKNOWN", "collect.trade.broadcastUnknown"],
  ["RECIPIENT_NOT_ACKNOWLEDGED", DETAILS_MESSAGE],
  ["FRACTIONAL_AMOUNT", DETAILS_MESSAGE],
  ["ORDER_REFRESH_FAILED", SERVICE_MESSAGE],
]);

const API_CODES = new Map<string, MessageKey>([
  ["TRADING_UNAVAILABLE", SERVICE_MESSAGE],
  ["MARKET_UNAVAILABLE", SERVICE_MESSAGE],
  ["PROVIDER_UNAVAILABLE", SERVICE_MESSAGE],
  ["RECIPIENT_SCOPE_CHANGED", "collect.error.prepareRecipientChanged"],
  ["ORDER_MISMATCH", "collect.error.prepareTerms"],
  ["AMOUNT_MISMATCH", "collect.error.prepareTerms"],
  ["INVALID_INTENT", DETAILS_MESSAGE],
  ["INVALID_SIGNATURE", "collect.trade.checkFailed"],
  ["UNSUPPORTED_ACTION", UNSUPPORTED_MESSAGE],
  ["UNSUPPORTED_PROTOCOL", UNSUPPORTED_MESSAGE],
  ["UNSUPPORTED_ZONE", UNSUPPORTED_MESSAGE],
  ["UNSUPPORTED_CONDUIT", UNSUPPORTED_MESSAGE],
]);

function httpErrorMessage(error: unknown, status: number): MessageKey {
  if (status === 0) return "collect.error.prepareNetwork";
  if (status === 401 || status === 403) return "collect.error.prepareAuth";
  if (status === 429) return "collect.error.prepareRateLimited";
  const code = getStructuredApiErrorCode(error);
  const knownCode = code === undefined ? undefined : API_CODES.get(code);
  if (knownCode !== undefined) return knownCode;
  if (status >= 500 && status <= 599) return SERVICE_MESSAGE;
  if (status === 400 || status === 422) return DETAILS_MESSAGE;
  if (status === 404 || status === 409) return "collect.error.prepareTerms";
  return "collect.error.prepare";
}

function isNetworkFailure(error: Error): boolean {
  // common-api normalizes browser fetch failures to these prefixes. Only use
  // them for classification; the original message can contain private URLs.
  if (
    error.message.startsWith("Network request failed.") ||
    error.message.startsWith("Network error:")
  )
    return true;
  return (
    error instanceof TypeError &&
    [
      "failed to fetch",
      "load failed",
      "networkerror when attempting to fetch resource.",
    ].includes(error.message.toLowerCase())
  );
}

/** Preparation only: preserve execution/recovery state and never expose raw API text. */
export function marketPreparationError(
  error: unknown,
  locale: SupportedLocale
): string {
  const status = getStructuredApiErrorStatus(error);
  if (status !== undefined) return t(locale, httpErrorMessage(error, status));
  if (error instanceof Error) {
    const knownLocal = LOCAL_ERRORS.get(error.message);
    if (knownLocal !== undefined) return t(locale, knownLocal);
    if (isNetworkFailure(error))
      return t(locale, "collect.error.prepareNetwork");
  }
  return t(locale, "collect.error.prepare");
}
