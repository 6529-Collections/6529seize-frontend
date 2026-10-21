"use client";
import { SortDirection } from "@/entities/ISort";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { LeaderboardCollector } from "./LeaderboardCollector";
import type { NftTDHRanked } from "./NFTLeaderboard";

export enum Sort {
  balance = "balance",
  tdh__raw = "tdh__raw",
  boosted_tdh = "boosted_tdh",
  total_balance = "total_balance",
  total_tdh__raw = "total_tdh__raw",
  total_boosted_tdh = "total_boosted_tdh",
}

type CollectorSort = { sort: Sort; sort_direction: SortDirection };
export default function NFTLeaderboardMobile({
  leaderboard,
  totalResults,
  sort,
  setSort,
  locale,
}: {
  readonly leaderboard: readonly NftTDHRanked[];
  readonly totalResults: number;
  readonly sort: CollectorSort;
  readonly setSort: (sort: CollectorSort) => void;
  readonly locale: SupportedLocale;
}) {
  const mobileSortOptions = [
    {
      value: Sort.balance,
      label: t(locale, "theMemes.detail.mobile.sort.balance"),
    },
    {
      value: Sort.boosted_tdh,
      label: t(locale, "theMemes.detail.mobile.sort.boosted_tdh"),
    },
    {
      value: Sort.tdh__raw,
      label: t(locale, "theMemes.detail.mobile.sort.tdh__raw"),
    },
    {
      value: Sort.total_balance,
      label: t(locale, "theMemes.detail.mobile.sort.total_balance"),
    },
    {
      value: Sort.total_boosted_tdh,
      label: t(locale, "theMemes.detail.mobile.sort.total_boosted_tdh"),
    },
    {
      value: Sort.total_tdh__raw,
      label: t(locale, "theMemes.detail.mobile.sort.total_tdh__raw"),
    },
  ];

  return (
    <div className="sm:tw-hidden">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-text-xs tw-text-iron-400">
        <span>
          {t(locale, "theMemes.detail.mobile.collectorCount", {
            count: formatInteger(locale, totalResults),
          })}
        </span>
        <label className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-sr-only">
            {t(locale, "theMemes.detail.mobile.sort")}
          </span>
          <select
            value={`${sort.sort}:${sort.sort_direction}`}
            className="tw-min-h-10 tw-max-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-2 tw-text-xs tw-text-iron-200"
            onChange={(event) => {
              const option = mobileSortOptions.find(({ value }) =>
                event.target.value.startsWith(`${value}:`)
              );
              if (option)
                setSort({
                  sort: option.value,
                  sort_direction: event.target.value.endsWith(
                    `:${SortDirection.ASC}`
                  )
                    ? SortDirection.ASC
                    : SortDirection.DESC,
                });
            }}
          >
            {mobileSortOptions.flatMap((option) =>
              [SortDirection.DESC, SortDirection.ASC].map((direction) => (
                <option
                  key={`${option.value}:${direction}`}
                  value={`${option.value}:${direction}`}
                >
                  {option.label} {direction === SortDirection.ASC ? "↑" : "↓"}
                </option>
              ))
            )}
          </select>
        </label>
      </div>
      <ol className="tw-m-0 tw-list-none tw-p-0">
        {leaderboard.map((lead) => (
          <MobileCollectorRow
            key={lead.consolidation_key}
            lead={lead}
            locale={locale}
          />
        ))}
      </ol>
    </div>
  );
}

function CompactCollectorNumber({
  value,
  locale,
}: {
  readonly value: number;
  readonly locale: SupportedLocale;
}) {
  const exact = formatNumber(locale, value, { maximumFractionDigits: 20 });
  return (
    <span title={exact}>
      <span aria-hidden="true">
        {formatNumber(locale, value, {
          notation: "compact",
          maximumFractionDigits: 1,
        })}
      </span>
      <span className="tw-sr-only">{exact}</span>
    </span>
  );
}

function MobileCollectorRow({
  lead,
  locale,
}: {
  readonly lead: NftTDHRanked;
  readonly locale: SupportedLocale;
}) {
  return (
    <li className="tw-grid tw-grid-cols-[22px_minmax(0,1fr)_auto] tw-gap-x-2.5 tw-gap-y-1 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3">
      <span className="tw-row-span-3 tw-pt-2 tw-text-xs tw-text-iron-500">
        {formatInteger(locale, lead.rank)}
      </span>
      <LeaderboardCollector
        handle={lead.handle}
        consolidationKey={lead.consolidation_key}
        consolidationDisplay={lead.consolidation_display}
        pfp={lead.pfp_url}
        level={lead.level}
      />
      <span className="tw-self-center tw-text-right tw-text-sm tw-font-semibold tw-text-iron-50">
        <CompactCollectorNumber value={lead.balance} locale={locale} />{" "}
        <span className="tw-text-xs tw-font-normal tw-text-iron-500">
          {t(locale, "theMemes.detail.mobile.cards")}
        </span>
      </span>
      <div className="tw-col-span-2 tw-col-start-2 tw-flex tw-flex-wrap tw-gap-x-3 tw-text-xs tw-leading-[18px] tw-text-iron-400">
        <span>
          <span className="tw-text-iron-500">
            {t(locale, "theMemes.detail.art.fields.tdh")}
          </span>{" "}
          <CompactCollectorNumber value={lead.boosted_tdh} locale={locale} />
        </span>
        <span>
          <span className="tw-text-iron-500">
            {t(locale, "theMemes.detail.mobile.unweighted")}
          </span>{" "}
          <CompactCollectorNumber value={lead.tdh__raw} locale={locale} />
        </span>
      </div>
      <div className="tw-col-span-2 tw-col-start-2 tw-flex tw-flex-wrap tw-gap-x-3 tw-text-xs tw-leading-[18px] tw-text-iron-400">
        <span>
          <span className="tw-text-iron-500">
            {t(locale, "theMemes.detail.mobile.allCards")}
          </span>{" "}
          <CompactCollectorNumber value={lead.total_balance} locale={locale} />
        </span>
        <span>
          <span className="tw-text-iron-500">
            {t(locale, "theMemes.detail.art.fields.tdh")}
          </span>{" "}
          <CompactCollectorNumber
            value={lead.total_boosted_tdh}
            locale={locale}
          />
        </span>
        <span>
          <span className="tw-text-iron-500">
            {t(locale, "theMemes.detail.mobile.unweighted")}
          </span>{" "}
          <CompactCollectorNumber value={lead.total_tdh__raw} locale={locale} />
        </span>
      </div>
    </li>
  );
}
