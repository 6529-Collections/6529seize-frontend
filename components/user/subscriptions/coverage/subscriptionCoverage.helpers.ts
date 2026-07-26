import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageMode } from "@/generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { formatDate, formatInteger, formatNumber, formatTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export type SubscriptionCoverageTone =
  | "neutral"
  | "positive"
  | "caution"
  | "danger";

type SubscriptionCoverageAction =
  | "manage"
  | "set_up"
  | "choose_drops"
  | "top_up";

interface SubscriptionCoveragePresentation {
  readonly action: SubscriptionCoverageAction;
  readonly label: string;
  readonly tone: SubscriptionCoverageTone;
}

const ETH_DISPLAY_OPTIONS = {
  maximumFractionDigits: 6,
  minimumFractionDigits: 0,
} satisfies Intl.NumberFormatOptions;

export function formatSubscriptionEth(
  locale: SupportedLocale,
  value: string | number
): string {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }
  return formatNumber(locale, numericValue, ETH_DISPLAY_OPTIONS);
}

export function getSubscriptionCoveragePresentation(
  locale: SupportedLocale,
  status: ApiSubscriptionCoverageStatus
): SubscriptionCoveragePresentation {
  switch (status) {
    case ApiSubscriptionCoverageStatus.Covered:
      return {
        action: "manage",
        label: t(locale, "subscriptions.coverage.status.covered"),
        tone: "positive",
      };
    case ApiSubscriptionCoverageStatus.EarlyWarning:
      return {
        action: "top_up",
        label: t(locale, "subscriptions.coverage.status.planTopUp"),
        tone: "caution",
      };
    case ApiSubscriptionCoverageStatus.RunningLow:
      return {
        action: "top_up",
        label: t(locale, "subscriptions.coverage.status.runningLow"),
        tone: "caution",
      };
    case ApiSubscriptionCoverageStatus.ActionRequired:
      return {
        action: "top_up",
        label: t(locale, "subscriptions.coverage.status.actionRequired"),
        tone: "danger",
      };
    case ApiSubscriptionCoverageStatus.NotSetUp:
      return {
        action: "set_up",
        label: t(locale, "subscriptions.coverage.status.notSetUp"),
        tone: "neutral",
      };
    case ApiSubscriptionCoverageStatus.NoCurrentEligibility:
      return {
        action: "manage",
        label: t(locale, "subscriptions.coverage.status.noEligibility"),
        tone: "neutral",
      };
    case ApiSubscriptionCoverageStatus.NoUpcomingSelections:
      return {
        action: "choose_drops",
        label: t(locale, "subscriptions.coverage.status.noSelections"),
        tone: "neutral",
      };
    case ApiSubscriptionCoverageStatus.Unknown:
      return {
        action: "manage",
        label: t(locale, "subscriptions.coverage.status.unknown"),
        tone: "neutral",
      };
  }
}

export function getSubscriptionCoverageActionLabel(
  locale: SupportedLocale,
  action: SubscriptionCoverageAction,
  compact = false
): string {
  switch (action) {
    case "set_up":
      return t(locale, "subscriptions.coverage.action.setUp");
    case "choose_drops":
      return t(locale, "subscriptions.coverage.action.chooseDrops");
    case "top_up":
      return compact
        ? t(locale, "subscriptions.coverage.action.topUp")
        : t(locale, "subscriptions.coverage.action.topUpSubscriptions");
    case "manage":
      return compact
        ? t(locale, "subscriptions.coverage.action.manage")
        : t(locale, "subscriptions.coverage.action.reviewSettings");
  }
}

export function getSubscriptionCoverageAnchor(
  action: SubscriptionCoverageAction
): string {
  switch (action) {
    case "top_up":
      return "#profile-subscriptions-top-up";
    case "choose_drops":
      return "#profile-subscriptions-upcoming";
    case "manage":
    case "set_up":
      return "#profile-subscriptions-settings";
  }
}

export function getSubscriptionModeLabel(
  locale: SupportedLocale,
  mode: ApiSubscriptionCoverageMode | null
): string {
  if (mode === ApiSubscriptionCoverageMode.Automatic) {
    return t(locale, "subscriptions.coverage.mode.automatic");
  }
  if (mode === ApiSubscriptionCoverageMode.Manual) {
    return t(locale, "subscriptions.coverage.mode.manual");
  }
  return t(locale, "subscriptions.coverage.mode.notConfigured");
}

export function getFundedDropsLabel(
  locale: SupportedLocale,
  count: number
): string {
  return t(
    locale,
    count === 1
      ? "subscriptions.coverage.dropsFunded.one"
      : "subscriptions.coverage.dropsFunded.many",
    { count: formatInteger(locale, count) }
  );
}

export function getSubscriptionCoverageCompactLine(
  locale: SupportedLocale,
  coverage: ApiSubscriptionCoverage
): string {
  const parts = [
    getSubscriptionModeLabel(locale, coverage.mode),
    t(locale, "subscriptions.coverage.balanceEth", {
      amount: formatSubscriptionEth(locale, coverage.balance_eth),
    }),
  ];

  if (
    coverage.status !== ApiSubscriptionCoverageStatus.NotSetUp &&
    coverage.status !== ApiSubscriptionCoverageStatus.NoCurrentEligibility &&
    coverage.status !== ApiSubscriptionCoverageStatus.NoUpcomingSelections &&
    coverage.status !== ApiSubscriptionCoverageStatus.Unknown
  ) {
    parts.push(
      getFundedDropsLabel(locale, coverage.fully_funded_drops)
    );
  }

  return parts.join(" · ");
}

export function formatSubscriptionCoverageDate(
  locale: SupportedLocale,
  value: Date | string
): string {
  return formatDate(locale, value, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatSubscriptionCoverageDeadline(
  locale: SupportedLocale,
  value: Date | string
): string {
  const date = formatSubscriptionCoverageDate(locale, value);
  const time = formatTime(locale, value, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return time ? `${date}, ${time} UTC` : date;
}
