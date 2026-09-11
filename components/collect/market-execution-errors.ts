import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function marketExecutionError(
  error: unknown,
  locale: SupportedLocale
): string {
  if (error instanceof Error) {
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
