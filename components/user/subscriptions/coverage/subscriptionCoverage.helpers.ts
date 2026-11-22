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

/**
 * The API reports `action_required` for zero or one fully funded drop. With
 * one funded drop the next drop is covered, so it reads as running low.
 */
export function getDisplayedSubscriptionCoverageStatus(
  status: ApiSubscriptionCoverageStatus,
  fullyFundedDrops: number
): ApiSubscriptionCoverageStatus {
  return status === ApiSubscriptionCoverageStatus.ActionRequired &&
    fullyFundedDrops > 0
    ? ApiSubscriptionCoverageStatus.RunningLow
    : status;
}

/**
 * True when funding reaches the last drop of the truncated forecast, so the
 * balance may cover later drops that the forecast does not evaluate.
 */
type ForecastEndCoverage = Pick<
  ApiSubscriptionCoverage,
  "funded_through" | "fully_funded_drops"
> & {
  readonly next_unfunded?: ApiSubscriptionCoverage["next_unfunded"] | undefined;
  // Older cached or partial payloads can omit the forecast block.
  readonly forecast?:
    | Pick<
        ApiSubscriptionCoverage["forecast"],
        "forecast_truncated" | "horizon_end_token_id" | "horizon_drop_count"
      >
    | undefined;
};

export function isSubscriptionCoverageFundedToForecastEnd(
  coverage: ForecastEndCoverage | undefined | null
): boolean {
  const horizonEnd = coverage?.forecast?.horizon_end_token_id ?? null;
  return (
    !!coverage?.funded_through &&
    !coverage.next_unfunded &&
    coverage.fully_funded_drops > 0 &&
    coverage.forecast?.forecast_truncated === true &&
    horizonEnd !== null &&
    coverage.funded_through.token_id === horizonEnd
  );
}

/**
 * True when every scheduled drop in the forecast is funded, so the funded
 * count is the forecast size and the balance may fund more drops.
 */
export function isSubscriptionCoverageForecastFullyFunded(
  coverage: ForecastEndCoverage | undefined | null
): boolean {
  return (
    isSubscriptionCoverageFundedToForecastEnd(coverage) &&
    coverage?.fully_funded_drops === coverage?.forecast?.horizon_drop_count
  );
}

export interface SubscriptionFundedDropsAtCurrentSettings {
  readonly count: number;
  readonly capped: boolean;
}

/**
 * The backend's funded-drop count past the forecast horizon, when it reports
 * one, funding reaches the end of the forecast and the count goes beyond the
 * forecast's funded drops. Otherwise (older backends without the field, manual
 * mode, or a balance that funds exactly the forecast) callers keep the
 * forecast-window wording, which is then exact.
 */
export function getSubscriptionFundedDropsAtCurrentSettings(
  coverage:
    | (ForecastEndCoverage &
        Pick<
          ApiSubscriptionCoverage,
          | "funded_drops_at_current_settings"
          | "funded_drops_at_current_settings_capped"
        >)
    | undefined
    | null
): SubscriptionFundedDropsAtCurrentSettings | null {
  const count = coverage?.funded_drops_at_current_settings;
  if (
    typeof count !== "number" ||
    !Number.isSafeInteger(count) ||
    count <= (coverage?.fully_funded_drops ?? 0) ||
    !isSubscriptionCoverageFundedToForecastEnd(coverage)
  ) {
    return null;
  }
  return {
    count,
    capped: coverage?.funded_drops_at_current_settings_capped === true,
  };
}

export function getFundedDropsAtCurrentSettingsLabel(
  locale: SupportedLocale,
  funded: SubscriptionFundedDropsAtCurrentSettings
): string {
  return t(
    locale,
    funded.capped
      ? "subscriptions.coverage.summary.fundedDropsAtLeast"
      : "subscriptions.coverage.summary.fundedDropsAbout",
    { count: formatInteger(locale, funded.count) }
  );
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

function getSubscriptionModeLabel(
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

function getCompactFundedDropsLabel(
  locale: SupportedLocale,
  coverage: ApiSubscriptionCoverage
): string {
  const fundedAtCurrentSettings =
    getSubscriptionFundedDropsAtCurrentSettings(coverage);
  if (fundedAtCurrentSettings) {
    return getFundedDropsAtCurrentSettingsLabel(
      locale,
      fundedAtCurrentSettings
    );
  }
  if (isSubscriptionCoverageForecastFullyFunded(coverage)) {
    return t(locale, "subscriptions.coverage.summary.nextFundedDrops", {
      count: formatInteger(locale, coverage.fully_funded_drops),
    });
  }
  return getFundedDropsLabel(locale, coverage.fully_funded_drops);
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
    parts.push(getCompactFundedDropsLabel(locale, coverage));
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
