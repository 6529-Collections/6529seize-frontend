import type { ApiMarketOrder } from "@/generated/models/ApiMarketOrder";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderScopeEnum,
} from "@/generated/models/ApiMarketOrder";
import type { SupportedLocale } from "@/i18n/locales";
import {
  formatDate as formatLocalizedDate,
  formatDecimalString,
  formatInteger as formatLocalizedInteger,
} from "@/i18n/format";
import { t } from "@/i18n/messages";

export { formatDecimalString as formatDecimal };

export function formatInteger(
  locale: SupportedLocale,
  value: string | null | undefined
): string {
  if (value === null || value === undefined || value.length === 0) {
    return "—";
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed)
    ? formatLocalizedInteger(locale, parsed)
    : value;
}

export function formatDate(
  value: Date | string | null | undefined,
  locale: SupportedLocale
) {
  if (value === null || value === undefined) {
    return null;
  }

  const formatted = formatLocalizedDate(locale, value, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return formatted === "-" ? null : formatted;
}

export function getScopeLabel(
  locale: SupportedLocale,
  scope: ApiMarketOrder["scope"]
): string {
  switch (scope) {
    case ApiMarketOrderScopeEnum.Token:
      return t(locale, "marketDepth.orders.tokenScope");
    case ApiMarketOrderScopeEnum.Collection:
      return t(locale, "marketDepth.orders.collectionScope");
    case ApiMarketOrderScopeEnum.Trait:
      return t(locale, "marketDepth.orders.traitScope");
    case ApiMarketOrderScopeEnum.Unknown:
      return t(locale, "marketDepth.orders.scopeUnknown");
    default:
      return t(locale, "marketDepth.orders.scopeUnknown");
  }
}

export function getApplicabilityLabel(
  locale: SupportedLocale,
  applicability: ApiMarketOrder["applicability"]
): string {
  switch (applicability) {
    case ApiMarketOrderApplicabilityEnum.Token:
      return t(locale, "marketDepth.orders.tokenMatch");
    case ApiMarketOrderApplicabilityEnum.Collection:
      return t(locale, "marketDepth.orders.collectionMatch");
    case ApiMarketOrderApplicabilityEnum.CriteriaUnverified:
      return t(locale, "marketDepth.orders.criteriaUnverified");
    default:
      return t(locale, "marketDepth.orders.criteriaUnverified");
  }
}
