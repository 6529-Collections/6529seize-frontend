import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isMarketSendRejected } from "./market-send-attempt";
import { marketPreparationError } from "./market-preparation-errors";
import {
  getStructuredApiErrorStatus,
  getStructuredApiErrorCode,
} from "@/services/api/common-api";

export function marketExecutionError(
  error: unknown,
  locale: SupportedLocale
): string {
  if (isMarketSendRejected(error))
    return t(locale, "collect.trade.walletRejected");
  const code = getStructuredApiErrorCode(error);
  if (code === "OPERATION_CHANGED")
    return t(locale, "collect.trade.refreshRequired");
  if (getStructuredApiErrorStatus(error) !== undefined)
    return marketPreparationError(error, locale);
  if (error instanceof Error) {
    if (error.message === "MARKET_WALLET_NOT_READY")
      return t(locale, "collect.trade.walletNotReady");
    if (
      ["MARKET_CONNECTION_CHANGED", "MARKET_PROFILE_CHANGED"].includes(
        error.message
      )
    )
      return t(locale, "collect.error.prepareConnectionChanged");
    if (error.message === "MARKET_WRONG_CHAIN")
      return t(locale, "collect.trade.wrongChain");
    if (error.message === "MARKET_UNSUPPORTED_WALLET")
      return t(locale, "collect.error.prepareUnsupported");
    if (error.message === "MARKET_ACTION_DISABLED")
      return t(locale, "collect.error.prepareService");
    if (
      ["MARKET_GAS_CAP_CHANGED", "MARKET_GAS_CAP_MISSING"].includes(
        error.message
      )
    )
      return t(locale, "collect.trade.gasChanged");
    if (error.message === "MARKET_SUBMISSION_PENDING")
      return t(locale, "collect.trade.submissionPending");
    if (error.message === "MARKET_REVIEW_MISMATCH")
      return t(locale, "collect.trade.checkFailed");
    if (error.message === "MARKET_APPROVAL_REVERTED")
      return t(locale, "collect.trade.approvalReverted");
    if (error.message === "MARKET_REVIEW_REFRESH_REQUIRED")
      return t(locale, "collect.trade.refreshRequired");
    if (error.message === "MARKET_OFFER_QUANTITY_CHANGED")
      return t(locale, "collect.error.offerQuantity");
    if (error.message === "MARKET_OFFER_LIMIT_EXCEEDED")
      return t(locale, "collect.error.offerLimit");
    if (error.message === "MARKET_BROADCAST_UNKNOWN")
      return t(locale, "collect.trade.broadcastUnknown");
    if (error.message === "MARKET_RECOVERY_STORAGE_UNAVAILABLE")
      return t(locale, "collect.trade.storageUnavailable");
    if (error.message === "MARKET_EXECUTION_LOCK_UNAVAILABLE")
      return t(locale, "collect.trade.lockUnavailable");
    if (error.message === "MARKET_EXECUTION_ALREADY_ACTIVE")
      return t(locale, "collect.trade.lockActive");
  }
  return t(locale, "collect.trade.walletFailed");
}
