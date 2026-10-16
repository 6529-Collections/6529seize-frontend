import { formatDate, formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

/**
 * The historic boosts page's data and formatting, shared by the page and
 * its current-schedule parts.
 */

type HistoricBoostsMessageKey = Extract<
  MessageKey,
  `network.tdhHistoric.${string}`
>;

export interface HistoricRule {
  readonly id: string;
  readonly version: string;
  readonly startDate: number;
  readonly startDateIso: string;
  readonly endDate: number;
  readonly endDateIso: string;
  readonly completeSetMultiplier: number;
  readonly maxSeason: number;
  readonly categoryBAppliesToTotal: boolean;
}

export const HISTORIC_RULES: readonly HistoricRule[] = [
  {
    id: "tdh-1-3",
    version: "1.3",
    startDate: Date.UTC(2024, 2, 29),
    startDateIso: "2024-03-29",
    endDate: Date.UTC(2025, 9, 9),
    endDateIso: "2025-10-09",
    completeSetMultiplier: 1.55,
    maxSeason: 11,
    categoryBAppliesToTotal: true,
  },
  {
    id: "tdh-1-2",
    version: "1.2",
    startDate: Date.UTC(2023, 11, 30),
    startDateIso: "2023-12-30",
    endDate: Date.UTC(2024, 2, 28),
    endDateIso: "2024-03-28",
    completeSetMultiplier: 1.25,
    maxSeason: 5,
    categoryBAppliesToTotal: false,
  },
  {
    id: "tdh-1-1",
    version: "1.1",
    startDate: Date.UTC(2023, 6, 14),
    startDateIso: "2023-07-14",
    endDate: Date.UTC(2023, 11, 29),
    endDateIso: "2023-12-29",
    completeSetMultiplier: 1.2,
    maxSeason: 4,
    categoryBAppliesToTotal: false,
  },
] as const;

export const TABLE_HEADER_CLASS =
  "tw-border-0 tw-px-3 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400 first:tw-pl-4 sm:first:tw-pl-6 last:tw-pr-4 sm:last:tw-pr-6";
export const TABLE_CELL_CLASS =
  "tw-border-0 tw-px-3 tw-py-4 tw-text-left tw-text-sm tw-leading-5 tw-text-iron-400 first:tw-pl-4 sm:first:tw-pl-6 last:tw-pr-4 sm:last:tw-pr-6";
export const DETAIL_PANEL_CLASS =
  "tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/45 tw-p-4";

export const m = (
  locale: SupportedLocale,
  key: HistoricBoostsMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

export const CURRENT_KEY = "network.tdhHistoric.timeline.current";
export const VERSION_LABEL_KEY = "network.tdhHistoric.versionLabel";

export const CURRENT_RULE = {
  version: "1.4",
  startDateIso: "2025-10-10",
  valueDateIso: "2026-10-16",
  today: 1.8,
  ceiling: 2,
  maxSeason: 20,
  payingSeasons: 16,
  gradients: 5,
} as const;

export function MobileSummaryMetric({
  label,
  value,
  sub,
  valueClassName = "tw-text-iron-300",
}: {
  readonly label: string;
  readonly value: string;
  /** A muted line under the value. */
  readonly sub?: string;
  readonly valueClassName?: string;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className="tw-text-balance tw-text-sm tw-leading-5 tw-text-iron-400">
        {label}
      </dt>
      <dd
        className={`tw-m-0 tw-mt-1 tw-text-sm tw-font-medium tw-tabular-nums tw-leading-5 ${valueClassName}`}
      >
        {value}
        {sub && (
          <span className="tw-mt-0.5 tw-block tw-text-[13px] tw-font-normal tw-text-iron-400">
            {sub}
          </span>
        )}
      </dd>
    </div>
  );
}

/** One short date format for every date on the page: "Mar 29, 2024". */
export function formatShortDate(
  locale: SupportedLocale,
  date: number | string
): string {
  return formatDate(locale, date, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatVersionLabel(
  locale: SupportedLocale,
  rule: HistoricRule
): string {
  return m(locale, VERSION_LABEL_KEY, {
    version: rule.version,
  });
}

export function formatSeasonRange(
  locale: SupportedLocale,
  rule: HistoricRule
): string {
  return m(locale, "network.tdhHistoric.table.seasonRange", {
    maxSeason: formatInteger(locale, rule.maxSeason),
  });
}

/**
 * The Gradient bonus: +0.02 for each, up to 3 in the archived schedules
 * and up to 5 in the current one.
 */
export function formatGradientBonus(
  locale: SupportedLocale,
  count = 3
): string {
  return m(locale, "network.tdhHistoric.table.gradientValue", {
    bonus: formatNumber(locale, 0.02, { minimumFractionDigits: 2 }),
    count: formatInteger(locale, count),
  });
}

export function formatMultiplier(
  locale: SupportedLocale,
  value: number
): string {
  return t(locale, "network.tdh.value.multiplier", {
    value: formatNumber(locale, value, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });
}
