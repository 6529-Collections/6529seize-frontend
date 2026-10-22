import { useEffect, useRef } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import Button from "@/components/utils/button/Button";
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
    <div className="tw-mb-2 tw-flex tw-items-center tw-gap-2 md:tw-hidden">
      <fieldset className="tw-m-0 tw-flex tw-h-8 tw-shrink-0 tw-items-center tw-gap-0.5 tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-p-0.5">
        <legend className="tw-sr-only">
          {t(locale, "theMemes.sorting.directionLegend")}
        </legend>
        {[SortDirection.ASC, SortDirection.DESC].map((value) => {
          const Icon =
            value === SortDirection.ASC ? ArrowUpIcon : ArrowDownIcon;
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
              className={`tw-m-0 tw-inline-flex tw-size-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-p-0 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none ${direction === value ? "tw-bg-iron-700 tw-text-white" : "tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-200"}`}
            >
              <Icon className="tw-size-[13px]" aria-hidden="true" />
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
          <Button
            key={value}
            ref={sort === value ? selected : undefined}
            variant={sort === value ? "primary" : "tertiary"}
            size="xs"
            aria-pressed={sort === value}
            onClick={() => onSort(value)}
            className="motion-reduce:tw-transition-none"
          >
            {label}
          </Button>
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
    <span className={`${className} tw-min-w-0 tw-whitespace-nowrap`}>
      <span className="tw-sr-only">
        {t(locale, "theMemes.detail.collectors.metricValue", {
          label: accessibleLabel,
          value: exact,
        })}
      </span>
      <span
        aria-hidden="true"
        title={exact}
        className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-1 max-[359px]:tw-flex-wrap max-[359px]:tw-gap-y-0"
      >
        <span className="tw-order-1 tw-text-iron-500">{label}</span>
        <span
          className={`tw-font-medium ${active ? "tw-text-iron-50" : "tw-text-inherit"}`}
        >
          {formatMobileValue(locale, value)}
        </span>
      </span>
    </span>
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
      className="tw-m-0 tw-list-none tw-p-0 md:tw-hidden"
      aria-label={t(locale, "theMemes.detail.collectors.leaderboardTitle")}
    >
      {leaderboard.map((lead) => (
        <li
          key={lead.consolidation_key}
          className="tw-grid tw-grid-cols-[24px_32px_minmax(0,0.62fr)_minmax(0,0.76fr)_minmax(0,1.24fr)] tw-items-baseline tw-gap-x-2 tw-gap-y-1 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3.5 tw-text-xs tw-font-normal tw-tabular-nums tw-leading-4 max-[380px]:tw-text-[11px]"
        >
          <span className="tw-self-center tw-font-medium tw-text-iron-500">
            <span className="tw-sr-only">
              {t(locale, "theMemes.detail.collectors.rank")}{" "}
            </span>
            {formatInteger(locale, lead.rank)}
          </span>
          <div className="tw-col-span-4 tw-mb-2 tw-min-w-0 tw-self-center">
            <LeaderboardCollector
              handle={lead.handle}
              consolidationKey={lead.consolidation_key}
              consolidationDisplay={lead.consolidation_display}
              pfp={lead.pfp_url}
              level={lead.level}
            />
          </div>
          <span
            aria-hidden="true"
            className="tw-col-span-2 tw-whitespace-nowrap tw-text-iron-600"
          >
            {t(locale, "theMemes.detail.collectors.thisCard")}
          </span>
          <span className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-1 tw-whitespace-nowrap max-[359px]:tw-flex-wrap max-[359px]:tw-gap-y-0">
            <span className="tw-sr-only">
              {formatInteger(locale, lead.balance)}{" "}
            </span>
            <span
              aria-hidden="true"
              title={formatInteger(locale, lead.balance)}
              className={`tw-font-medium ${sort === "balance" ? "tw-text-iron-50" : "tw-text-iron-300"}`}
            >
              {formatMobileValue(locale, lead.balance)}{" "}
            </span>
            <span className="tw-text-iron-500">
              {t(
                locale,
                selectPluralCategory(locale, lead.balance) === "one"
                  ? "theMemes.detail.collectors.cardOne"
                  : "theMemes.detail.collectors.cardOther"
              )}
            </span>
          </span>
          <MobileMetric
            className="tw-text-iron-300"
            locale={locale}
            value={lead.boosted_tdh}
            label={t(locale, "theMemes.detail.collectors.tdh")}
            accessibleLabel={t(locale, "theMemes.detail.collectors.cardTdh")}
            active={sort === "boosted_tdh"}
          />
          <MobileMetric
            className="tw-text-iron-300"
            locale={locale}
            value={lead.tdh__raw}
            label={t(locale, "theMemes.detail.collectors.unweighted")}
            accessibleLabel={t(
              locale,
              "theMemes.detail.collectors.cardUnweightedTdh"
            )}
            active={sort === "tdh__raw"}
          />
          <span
            aria-hidden="true"
            className="tw-col-span-2 tw-whitespace-nowrap tw-text-iron-600"
          >
            {t(locale, "theMemes.detail.collectors.allCards")}
          </span>
          <MobileMetric
            className="tw-text-iron-400 [&>span:last-child>span:first-child]:tw-hidden"
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
            className="tw-text-iron-400 [&>span:last-child>span:first-child]:tw-hidden"
            locale={locale}
            value={lead.total_boosted_tdh}
            label={t(locale, "theMemes.detail.collectors.tdh")}
            accessibleLabel={t(locale, "theMemes.detail.collectors.totalTdh")}
            active={sort === "total_boosted_tdh"}
          />
          <MobileMetric
            className="tw-text-iron-400 [&>span:last-child>span:first-child]:tw-hidden"
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
