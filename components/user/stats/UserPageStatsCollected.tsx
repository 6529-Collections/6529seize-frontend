import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import { formatInteger, formatPercent } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { ReactNode } from "react";
import {
  STATS_SECTION_HEADING_CLASS,
  STATS_TABLE_CLASS,
  STATS_TABLE_GROUP_START_ROW_CLASS,
  STATS_TABLE_HEADER_CELL_CLASS,
  STATS_TABLE_HEAD_CLASS,
  STATS_TABLE_MUTED_VALUE_CELL_CLASS,
  STATS_TABLE_ROW_CLASS,
  STATS_TABLE_ROW_HEADER_CLASS,
  STATS_TABLE_VALUE_CELL_CLASS,
  UserPageStatsDisclosure,
  UserPageStatsTableHead,
  UserPageStatsTableScroll,
} from "./UserPageStatsTableShared";

function getRankDisplay(
  locale: SupportedLocale,
  balance: number | undefined,
  rank: number | undefined
) {
  if (
    balance === undefined ||
    balance === 0 ||
    !Number.isFinite(balance) ||
    rank === undefined ||
    rank === 0 ||
    !Number.isFinite(rank)
  ) {
    return "-";
  }
  return `#${formatInteger(locale, rank)}`;
}

type TotalsColumnConfig = readonly [
  key: string,
  balanceKey: keyof OwnerBalance,
  balanceRankKey: keyof OwnerBalance,
  tdhKey: keyof OwnerBalance | undefined,
  tdhRankKey: keyof OwnerBalance | undefined,
];

const TOTALS_COLUMN_CONFIG = [
  [
    "total",
    "total_balance",
    "total_balance_rank",
    "boosted_tdh",
    "boosted_tdh_rank",
  ],
  [
    "memes",
    "memes_balance",
    "memes_balance_rank",
    "boosted_memes_tdh",
    "boosted_memes_tdh_rank",
  ],
  [
    "nextgen",
    "nextgen_balance",
    "nextgen_balance_rank",
    "boosted_nextgen_tdh",
    "boosted_nextgen_tdh_rank",
  ],
  [
    "gradients",
    "gradients_balance",
    "gradients_balance_rank",
    "boosted_gradients_tdh",
    "boosted_gradients_tdh_rank",
  ],
  ["memelab", "memelab_balance", "memelab_balance_rank", undefined, undefined],
] as const satisfies readonly TotalsColumnConfig[];

function getOwnerBalanceNumber(
  ownerBalance: OwnerBalance | undefined,
  key: keyof OwnerBalance | undefined
) {
  const value = key ? ownerBalance?.[key] : undefined;
  return typeof value === "number" ? value : undefined;
}

function NumberCell({
  value,
  locale,
}: {
  readonly value: number | null | undefined;
  readonly locale: SupportedLocale;
}) {
  return (
    <td className={STATS_TABLE_VALUE_CELL_CLASS}>
      {formatInteger(locale, value)}
    </td>
  );
}

function RankCell({
  balance,
  rank,
  locale,
}: {
  readonly balance: number | undefined;
  readonly rank: number | undefined;
  readonly locale: SupportedLocale;
}) {
  return (
    <td className={STATS_TABLE_VALUE_CELL_CLASS}>
      {getRankDisplay(locale, balance, rank)}
    </td>
  );
}

function MutedCell({ children }: { readonly children: ReactNode }) {
  return <td className={STATS_TABLE_MUTED_VALUE_CELL_CLASS}>{children}</td>;
}

function RowHeader({ children }: { readonly children: ReactNode }) {
  return (
    <th scope="row" className={STATS_TABLE_ROW_HEADER_CLASS}>
      {children}
    </th>
  );
}

function roundedTdhValue(value: number | undefined, hasOwnerBalance: boolean) {
  return hasOwnerBalance && value !== undefined ? Math.round(value) : undefined;
}

export default function UserPageStatsCollected({
  ownerBalance,
  balanceMemes,
  seasons,
  locale = DEFAULT_LOCALE,
}: {
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
  readonly seasons: MemeSeason[];
  readonly locale?: SupportedLocale | undefined;
}) {
  return (
    <section
      aria-labelledby="collected-details-heading"
      className="tw-space-y-3"
    >
      <h3
        className={STATS_SECTION_HEADING_CLASS}
        id="collected-details-heading"
      >
        {t(locale, "user.collected.stats.details.collected.title")}
      </h3>
      <UserPageStatsCollectedTotals
        ownerBalance={ownerBalance}
        locale={locale}
      />
      <UserPageStatsCollectedMemes
        balanceMemes={balanceMemes}
        seasons={seasons}
        locale={locale}
      />
    </section>
  );
}

function UserPageStatsCollectedTotals({
  ownerBalance,
  locale,
}: {
  readonly ownerBalance: OwnerBalance | undefined;
  readonly locale: SupportedLocale;
}) {
  const caption = t(
    locale,
    "user.collected.stats.details.tables.overviewCaption"
  );
  const totalColumns = TOTALS_COLUMN_CONFIG.map(
    ([key, balanceKey, balanceRankKey, tdhKey, tdhRankKey]) => ({
      key,
      balance: getOwnerBalanceNumber(ownerBalance, balanceKey),
      balanceRank: getOwnerBalanceNumber(ownerBalance, balanceRankKey),
      tdh: getOwnerBalanceNumber(ownerBalance, tdhKey),
      tdhRank: getOwnerBalanceNumber(ownerBalance, tdhRankKey),
      hasTdh: tdhKey !== undefined,
    })
  );

  return (
    <UserPageStatsDisclosure
      title={t(locale, "user.collected.stats.details.overview")}
    >
      <UserPageStatsTableScroll label={caption}>
        <table className={`${STATS_TABLE_CLASS} tw-min-w-[46rem]`}>
          <UserPageStatsTableHead locale={locale} caption={caption} />
          <tbody>
            <tr className={STATS_TABLE_ROW_CLASS}>
              <RowHeader>
                {t(locale, "user.collected.stats.details.rows.cards")}
              </RowHeader>
              {totalColumns.map((column) => (
                <NumberCell
                  key={column.key}
                  value={column.balance}
                  locale={locale}
                />
              ))}
            </tr>
            <tr className={STATS_TABLE_ROW_CLASS}>
              <RowHeader>
                {t(locale, "user.collected.stats.details.rows.rank")}
              </RowHeader>
              {totalColumns.map((column) => (
                <RankCell
                  key={column.key}
                  balance={column.balance}
                  rank={column.balanceRank}
                  locale={locale}
                />
              ))}
            </tr>
            <tr className={STATS_TABLE_GROUP_START_ROW_CLASS}>
              <RowHeader>
                {t(locale, "user.collected.stats.details.rows.tdh")}
              </RowHeader>
              {totalColumns.map((column) =>
                column.hasTdh ? (
                  <NumberCell
                    key={column.key}
                    value={roundedTdhValue(column.tdh, !!ownerBalance)}
                    locale={locale}
                  />
                ) : (
                  <MutedCell key={column.key}>*</MutedCell>
                )
              )}
            </tr>
            <tr className={STATS_TABLE_ROW_CLASS}>
              <RowHeader>
                {t(locale, "user.collected.stats.details.rows.rank")}
              </RowHeader>
              {totalColumns.map((column) =>
                column.hasTdh ? (
                  <RankCell
                    key={column.key}
                    balance={column.tdh}
                    rank={column.tdhRank}
                    locale={locale}
                  />
                ) : (
                  <MutedCell key={column.key}>
                    {t(locale, "user.collected.stats.details.rows.noTdh")}
                  </MutedCell>
                )
              )}
            </tr>
          </tbody>
        </table>
      </UserPageStatsTableScroll>
    </UserPageStatsDisclosure>
  );
}

function UserPageStatsCollectedMemes({
  balanceMemes,
  seasons,
  locale,
}: {
  readonly balanceMemes: OwnerBalanceMemes[];
  readonly seasons: MemeSeason[];
  readonly locale: SupportedLocale;
}) {
  const caption = t(
    locale,
    "user.collected.stats.details.tables.memesBySeasonCaption"
  );
  const memeColumns = [
    t(locale, "user.collected.stats.details.tables.column.total"),
    t(locale, "user.collected.stats.details.tables.column.unique"),
    t(locale, "user.collected.stats.details.tables.column.sets"),
    t(locale, "user.collected.stats.details.rows.tdh"),
  ];

  function getDisplayWithValueAndRank(
    value: number | null | undefined,
    rank: number | null | undefined
  ) {
    if (
      value === null ||
      value === undefined ||
      value === 0 ||
      !Number.isFinite(value)
    ) {
      return "-";
    }
    if (
      rank === null ||
      rank === undefined ||
      rank === 0 ||
      !Number.isFinite(rank)
    ) {
      return formatInteger(locale, value);
    }

    return (
      <>
        {formatInteger(locale, value)}{" "}
        <span className="tw-text-iron-500">
          (#{formatInteger(locale, rank)})
        </span>
      </>
    );
  }

  function getUniqueDisplay(balanceMeme: OwnerBalanceMemes) {
    const seasonBalance = seasons.find(
      (season) => season.id === balanceMeme.season
    );
    if (!seasonBalance) {
      return formatInteger(locale, balanceMeme.unique);
    }

    const held =
      Number.isFinite(balanceMeme.unique) && balanceMeme.unique > 0
        ? balanceMeme.unique
        : 0;
    const total =
      Number.isFinite(seasonBalance.count) && seasonBalance.count > 0
        ? seasonBalance.count
        : 0;
    const completion = total > 0 ? held / total : 0;

    return (
      <>
        {t(locale, "user.collected.stats.details.uniqueProgress", {
          held: formatInteger(locale, held),
          total: formatInteger(locale, total),
        })}{" "}
        <span className="tw-text-iron-500">
          {t(locale, "user.collected.stats.details.uniqueProgressPercent", {
            percent: formatPercent(locale, completion, 0),
          })}
        </span>
      </>
    );
  }

  return (
    <UserPageStatsDisclosure
      title={t(locale, "user.collected.stats.details.memesBySeason")}
    >
      {balanceMemes.length > 0 ? (
        <UserPageStatsTableScroll label={caption}>
          <table className={`${STATS_TABLE_CLASS} tw-min-w-[42rem]`}>
            <caption className="tw-sr-only">{caption}</caption>
            <thead className={STATS_TABLE_HEAD_CLASS}>
              <tr>
                <th
                  scope="col"
                  className={`${STATS_TABLE_HEADER_CELL_CLASS} tw-sticky tw-left-0 tw-z-[2] tw-bg-iron-900 tw-text-left`}
                >
                  {t(
                    locale,
                    "user.collected.stats.details.tables.column.season"
                  )}
                </th>
                {memeColumns.map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className={`${STATS_TABLE_HEADER_CELL_CLASS} tw-text-right`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {balanceMemes.map((balanceMeme) => (
                <tr
                  key={`stats-collected-memes-${balanceMeme.season}`}
                  className={STATS_TABLE_ROW_CLASS}
                >
                  <th scope="row" className={STATS_TABLE_ROW_HEADER_CLASS}>
                    {t(locale, "user.collected.stats.details.seasonLabel", {
                      seasonNumber: balanceMeme.season,
                    })}
                  </th>
                  <td className={STATS_TABLE_VALUE_CELL_CLASS}>
                    {getDisplayWithValueAndRank(
                      balanceMeme.balance,
                      balanceMeme.rank
                    )}
                  </td>
                  <td className={STATS_TABLE_VALUE_CELL_CLASS}>
                    {getUniqueDisplay(balanceMeme)}
                  </td>
                  <td className={STATS_TABLE_VALUE_CELL_CLASS}>
                    {formatInteger(locale, balanceMeme.sets)}
                  </td>
                  <td className={STATS_TABLE_VALUE_CELL_CLASS}>
                    {getDisplayWithValueAndRank(
                      balanceMeme.boosted_tdh,
                      balanceMeme.tdh_rank
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </UserPageStatsTableScroll>
      ) : (
        <p className="tw-mb-0 tw-px-4 tw-py-5 tw-text-sm tw-text-iron-500">
          {t(locale, "user.collected.stats.details.tables.memesBySeasonEmpty")}
        </p>
      )}
    </UserPageStatsDisclosure>
  );
}
