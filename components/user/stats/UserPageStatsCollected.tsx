import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import { formatInteger, formatPercent } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { Fragment, type ReactNode } from "react";
import styles from "./UserPageStats.module.scss";
import {
  UserPageStatsTableHead,
  UserPageStatsTableHr,
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

const VALUE_CELL_CLASS = "tw-text-right !tw-text-[#fff]";
const MUTED_VALUE_CELL_CLASS = "tw-text-right !tw-text-[#93939f]";
const ROW_HEADER_CLASS = "!tw-text-[#93939f]";

function className(...classNames: readonly (string | undefined)[]): string {
  return classNames
    .filter((value): value is string => value !== undefined && value !== "")
    .join(" ");
}

const STATS_DISCLOSURE_SUMMARY_CLASS = className(
  styles["collectedAccordionButton"],
  "tw-flex tw-w-full tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-px-5 tw-py-4 tw-text-left tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden"
);
const STATS_DISCLOSURE_CARET_CLASS =
  "tw-h-2 tw-w-2 tw-shrink-0 tw-rotate-45 tw-border-b-2 tw-border-r-2 tw-border-iron-400 tw-transition-transform tw-duration-200 group-open:tw-rotate-[225deg]";
const STATS_DISCLOSURE_BODY_CLASS = className(
  styles["collectedAccordionBody"],
  "tw-px-5 tw-py-4"
);
const STATS_SCROLL_CONTAINER_CLASS = className(
  "tw-py-2",
  styles["scrollContainer"]
);
const STATS_TABLE_CLASS = className(
  "tw-w-full",
  styles["collectedAccordionTable"]
);

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
  return <td className={VALUE_CELL_CLASS}>{formatInteger(locale, value)}</td>;
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
    <td className={VALUE_CELL_CLASS}>
      {getRankDisplay(locale, balance, rank)}
    </td>
  );
}

function MutedCell({ children }: { readonly children: ReactNode }) {
  return <td className={MUTED_VALUE_CELL_CLASS}>{children}</td>;
}

function RowHeader({ children }: { readonly children: ReactNode }) {
  return (
    <th scope="row" className={ROW_HEADER_CLASS}>
      <b>{children}</b>
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
    <div className="tw-py-2">
      <div className="tw-flex tw-py-2">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(locale, "user.collected.stats.details.collected.title")}
        </h3>
      </div>
      <div className="tw-py-2">
        <UserPageStatsCollectedTotals
          ownerBalance={ownerBalance}
          locale={locale}
        />
      </div>
      <div className="tw-py-2">
        <UserPageStatsCollectedMemes
          balanceMemes={balanceMemes}
          seasons={seasons}
          locale={locale}
        />
      </div>
    </div>
  );
}

function UserPageStatsCollectedTotals({
  ownerBalance,
  locale,
}: {
  readonly ownerBalance: OwnerBalance | undefined;
  readonly locale: SupportedLocale;
}) {
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
    <details className="tw-group" open>
      <summary className={STATS_DISCLOSURE_SUMMARY_CLASS}>
        <b>{t(locale, "user.collected.stats.details.overview")}</b>
        <span aria-hidden="true" className={STATS_DISCLOSURE_CARET_CLASS} />
      </summary>
      <div className={STATS_DISCLOSURE_BODY_CLASS}>
        <div className={STATS_SCROLL_CONTAINER_CLASS}>
          <table className={STATS_TABLE_CLASS}>
            <UserPageStatsTableHead
              locale={locale}
              caption={t(
                locale,
                "user.collected.stats.details.tables.overviewCaption"
              )}
            />
            <tbody>
              <UserPageStatsTableHr span={6} />
              <tr>
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
              <tr>
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
              <UserPageStatsTableHr span={6} />
              <tr>
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
              <tr>
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
        </div>
      </div>
    </details>
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
        <span className="!tw-text-[#93939f]">
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
    return (
      <>
        {t(locale, "user.collected.stats.details.uniqueProgress", {
          held:
            Number.isFinite(balanceMeme.unique) && balanceMeme.unique !== 0
              ? formatInteger(locale, balanceMeme.unique)
              : "0",
          total: formatInteger(locale, seasonBalance.count),
        })}{" "}
        <span className="!tw-text-[#93939f]">
          {t(locale, "user.collected.stats.details.uniqueProgressPercent", {
            percent: formatPercent(
              locale,
              balanceMeme.unique / seasonBalance.count,
              0
            ),
          })}
        </span>
      </>
    );
  }

  return (
    <details className="tw-group" open>
      <summary className={STATS_DISCLOSURE_SUMMARY_CLASS}>
        <b>{t(locale, "user.collected.stats.details.memesBySeason")}</b>
        <span aria-hidden="true" className={STATS_DISCLOSURE_CARET_CLASS} />
      </summary>
      <div className={STATS_DISCLOSURE_BODY_CLASS}>
        <div className={STATS_SCROLL_CONTAINER_CLASS}>
          <table className={STATS_TABLE_CLASS}>
            <caption className="tw-sr-only">
              {t(
                locale,
                "user.collected.stats.details.tables.memesBySeasonCaption"
              )}
            </caption>
            <thead>
              <tr>
                <th colSpan={2} aria-hidden="true"></th>
                {memeColumns.map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="tw-text-right !tw-text-[#93939f]"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {balanceMemes.map((balanceMeme) => (
                <Fragment key={`stats-collected-memes-${balanceMeme.season}`}>
                  <UserPageStatsTableHr span={6} />
                  <tr>
                    <th scope="row" colSpan={2} className="!tw-text-[#93939f]">
                      {t(locale, "user.collected.stats.details.seasonLabel", {
                        seasonNumber: balanceMeme.season,
                      })}
                    </th>
                    <td className="tw-text-right !tw-text-[#fff]">
                      {getDisplayWithValueAndRank(
                        balanceMeme.balance,
                        balanceMeme.rank
                      )}
                    </td>
                    <td className="tw-text-right !tw-text-[#fff]">
                      {getUniqueDisplay(balanceMeme)}
                    </td>
                    <td className="tw-text-right !tw-text-[#fff]">
                      {formatInteger(locale, balanceMeme.sets)}
                    </td>
                    <td className="tw-text-right !tw-text-[#fff]">
                      {getDisplayWithValueAndRank(
                        balanceMeme.boosted_tdh,
                        balanceMeme.tdh_rank
                      )}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
