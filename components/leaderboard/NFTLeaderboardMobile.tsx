import { useEffect, useRef } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { SortDirection } from "@/entities/ISort";
import {
  formatInteger,
  formatNumber,
  selectPluralCategory,
} from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import type { NftTDHRanked, Sort } from "./NFTLeaderboard";
import { LeaderboardCollector } from "./LeaderboardCollector";

function formatMobileValue(locale: SupportedLocale, value: number) {
  const rounded = Math.round(value);
  return rounded >= 100_000
    ? formatNumber(locale, rounded, {
        notation: "compact",
        maximumFractionDigits: 1,
      })
    : formatInteger(locale, rounded);
}

export function NFTLeaderboardMobileSort({
  locale,
  sort,
  direction,
  options,
  onSort,
  onDirection,
}: Readonly<{
  locale: SupportedLocale;
  sort: Sort;
  direction: SortDirection;
  options: readonly { value: Sort; label: string }[];
  onSort: (value: Sort) => void;
  onDirection: (value: SortDirection) => void;
}>) {
  const scroller = useRef<HTMLDivElement>(null);
  const selected = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = scroller.current;
    const button = selected.current;
    if (!container || !button) return;
    // Scroll only the horizontal strip, keeping the page/native shell still.
    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    if (buttonRect.left < containerRect.left + 12) {
      container.scrollLeft += buttonRect.left - containerRect.left - 12;
    } else if (buttonRect.right > containerRect.right - 28) {
      container.scrollLeft += buttonRect.right - containerRect.right + 28;
    }
  }, [sort]);

  return (
    <div className="tw-mb-2 tw-flex tw-items-center tw-gap-2 lg:tw-hidden">
      <fieldset className="tw-m-0 tw-flex tw-h-8 tw-shrink-0 tw-gap-0.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-0.5">
        <legend className="tw-sr-only">
          {t(locale, "theMemes.sorting.directionLegend")}
        </legend>
        {[SortDirection.ASC, SortDirection.DESC].map((value) => {
          const Icon =
            value === SortDirection.ASC ? ChevronUpIcon : ChevronDownIcon;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={direction === value}
              aria-label={t(
                locale,
                value === SortDirection.ASC
                  ? "theMemes.sorting.ascendingLabel"
                  : "theMemes.sorting.descendingLabel"
              )}
              onClick={() => onDirection(value)}
              className={`tw-flex tw-size-[26px] tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${direction === value ? "tw-bg-iron-700 tw-text-white" : "tw-bg-transparent tw-text-iron-500"}`}
            >
              <Icon className="tw-size-4" aria-hidden="true" />
            </button>
          );
        })}
      </fieldset>
      <div
        ref={scroller}
        role="group"
        aria-label={t(locale, "theMemes.detail.collectors.sortBy")}
        className="-tw-mr-4 tw-flex tw-min-w-0 tw-flex-1 tw-gap-1.5 tw-overflow-x-auto tw-py-1 tw-pl-3 tw-pr-7 [mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden"
      >
        {options.map(({ value, label }) => (
          <button
            key={value}
            ref={sort === value ? selected : undefined}
            type="button"
            aria-pressed={sort === value}
            onClick={() => onSort(value)}
            className={`tw-h-8 tw-shrink-0 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-2.5 tw-text-xs tw-font-semibold focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-primary-400 ${sort === value ? "tw-border-iron-200 tw-bg-iron-200 tw-text-iron-950" : "tw-border-iron-800 tw-bg-iron-950 tw-text-iron-100"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileMetric({
  locale,
  value,
  label,
  accessibleLabel,
  active,
  className,
}: Readonly<{
  locale: SupportedLocale;
  value: number;
  label: string;
  accessibleLabel: string;
  active: boolean;
  className: string;
}>) {
  const exact = formatInteger(locale, Math.round(value));

  return (
    <div
      className={`${className} tw-min-w-0 tw-text-xs tw-tabular-nums tw-leading-4 ${active ? "tw-font-semibold tw-text-iron-50" : "tw-text-iron-400"}`}
    >
      <span className="tw-sr-only">
        {t(locale, "theMemes.detail.collectors.metricValue", {
          label: accessibleLabel,
          value: exact,
        })}
      </span>
      <span aria-hidden="true" title={exact}>
        <span className={active ? "tw-text-iron-400" : "tw-text-iron-500"}>
          {label}
        </span>{" "}
        <span className="tw-whitespace-nowrap">
          {formatMobileValue(locale, value)}
        </span>
      </span>
    </div>
  );
}

export function NFTLeaderboardMobileRows({
  locale,
  leaderboard,
  sort,
}: Readonly<{
  locale: SupportedLocale;
  leaderboard: readonly NftTDHRanked[];
  sort: `${Sort}`;
}>) {
  return (
    <ol
      className="tw-m-0 tw-list-none tw-p-0 lg:tw-hidden"
      aria-label={t(locale, "theMemes.detail.collectors.leaderboardTitle")}
    >
      {leaderboard.map((lead) => (
        <li
          key={lead.consolidation_key}
          className="tw-grid tw-grid-cols-[22px_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)] tw-items-center tw-gap-x-2.5 tw-gap-y-0.5 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3"
        >
          <span className="tw-row-span-3 tw-self-start tw-pt-2 tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-500">
            <span className="tw-sr-only">
              {t(locale, "theMemes.detail.collectors.rank")}{" "}
            </span>
            {formatInteger(locale, lead.rank)}
          </span>
          <div className="tw-col-span-3 tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2 tw-pb-1">
            <div className="tw-min-w-0">
              <LeaderboardCollector
                handle={lead.handle}
                consolidationKey={lead.consolidation_key}
                consolidationDisplay={lead.consolidation_display}
                pfp={lead.pfp_url}
                level={lead.level}
              />
            </div>
            <span className="tw-shrink-0 tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-50">
              <span className="tw-sr-only">
                {formatInteger(locale, lead.balance)}{" "}
              </span>
              <span
                aria-hidden="true"
                title={formatInteger(locale, lead.balance)}
              >
                {formatMobileValue(locale, lead.balance)}{" "}
              </span>
              <span
                className={`tw-text-xs tw-font-medium ${sort === "balance" ? "tw-text-iron-400" : "tw-text-iron-500"}`}
              >
                {t(
                  locale,
                  selectPluralCategory(locale, lead.balance) === "one"
                    ? "theMemes.detail.collectors.cardOne"
                    : "theMemes.detail.collectors.cardOther"
                )}
              </span>
            </span>
          </div>
          <MobileMetric
            className="tw-col-start-2"
            locale={locale}
            value={lead.boosted_tdh}
            label={t(locale, "theMemes.detail.collectors.tdh")}
            accessibleLabel={t(locale, "theMemes.detail.collectors.cardTdh")}
            active={sort === "boosted_tdh"}
          />
          <MobileMetric
            className="tw-col-span-2 tw-col-start-3"
            locale={locale}
            value={lead.tdh__raw}
            label={t(locale, "theMemes.detail.collectors.unweighted")}
            accessibleLabel={t(
              locale,
              "theMemes.detail.collectors.cardUnweightedTdh"
            )}
            active={sort === "tdh__raw"}
          />
          <MobileMetric
            className="tw-col-start-2"
            locale={locale}
            value={lead.total_balance}
            label={t(locale, "theMemes.detail.collectors.allCards")}
            accessibleLabel={t(
              locale,
              "theMemes.detail.collectors.totalBalance"
            )}
            active={sort === "total_balance"}
          />
          <MobileMetric
            className="tw-col-start-3"
            locale={locale}
            value={lead.total_boosted_tdh}
            label={t(locale, "theMemes.detail.collectors.tdh")}
            accessibleLabel={t(locale, "theMemes.detail.collectors.totalTdh")}
            active={sort === "total_boosted_tdh"}
          />
          <MobileMetric
            className="tw-col-start-4"
            locale={locale}
            value={lead.total_tdh__raw}
            label={t(locale, "theMemes.detail.collectors.unweighted")}
            accessibleLabel={t(
              locale,
              "theMemes.detail.collectors.totalUnweightedTdh"
            )}
            active={sort === "total_tdh__raw"}
          />
        </li>
      ))}
    </ol>
  );
}
