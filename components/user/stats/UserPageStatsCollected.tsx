import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import { formatInteger, formatPercent } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { Fragment, type ReactNode } from "react";
import { Accordion, Col, Container, Row, Table } from "react-bootstrap";
import styles from "./UserPageStats.module.scss";
import {
  UserPageStatsTableHead,
  UserPageStatsTableHr,
} from "./UserPageStatsTableShared";

function getRankDisplay(balance: number | undefined, rank: number | undefined) {
  if (!balance || !rank) {
    return "-";
  }
  return `#${formatInteger(DEFAULT_LOCALE, rank)}`;
}

const VALUE_CELL_CLASS = "tw-text-right !tw-text-[#fff]";
const MUTED_VALUE_CELL_CLASS = "text-right !tw-text-[#93939f]";
const ROW_HEADER_CLASS = "!tw-text-[#93939f]";

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

function NumberCell({ value }: { readonly value: number | null | undefined }) {
  return (
    <td className={VALUE_CELL_CLASS}>{formatInteger(DEFAULT_LOCALE, value)}</td>
  );
}

function RankCell({
  balance,
  rank,
}: {
  readonly balance: number | undefined;
  readonly rank: number | undefined;
}) {
  return <td className={VALUE_CELL_CLASS}>{getRankDisplay(balance, rank)}</td>;
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
  return hasOwnerBalance ? Math.round(value ?? Number.NaN) : undefined;
}

export default function UserPageStatsCollected({
  ownerBalance,
  balanceMemes,
  seasons,
}: {
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
  readonly seasons: MemeSeason[];
}) {
  return (
    <div className="pt-2 pb-2">
      <div className="pt-2 pb-2 tw-flex">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(DEFAULT_LOCALE, "user.collected.stats.details.collected.title")}
        </h3>
      </div>
      <div className="pt-2 pb-2">
        <UserPageStatsCollectedTotals ownerBalance={ownerBalance} />
      </div>
      <div className="pt-2 pb-2">
        <UserPageStatsCollectedMemes
          balanceMemes={balanceMemes}
          seasons={seasons}
        />
      </div>
    </div>
  );
}

function UserPageStatsCollectedTotals({
  ownerBalance,
}: {
  readonly ownerBalance: OwnerBalance | undefined;
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
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles["collectedAccordionButton"]}>
          <b>{t(DEFAULT_LOCALE, "user.collected.stats.details.overview")}</b>
        </Accordion.Button>
        <Accordion.Body className={styles["collectedAccordionBody"]}>
          <Container>
            <Row className={`pt-2 pb-2 ${styles["scrollContainer"]}`}>
              <Col>
                <Table className={styles["collectedAccordionTable"]}>
                  <UserPageStatsTableHead
                    caption={t(
                      DEFAULT_LOCALE,
                      "user.collected.stats.details.tables.overviewCaption"
                    )}
                  />
                  <tbody>
                    <UserPageStatsTableHr span={6} />
                    <tr>
                      <RowHeader>
                        {t(
                          DEFAULT_LOCALE,
                          "user.collected.stats.details.rows.cards"
                        )}
                      </RowHeader>
                      {totalColumns.map((column) => (
                        <NumberCell key={column.key} value={column.balance} />
                      ))}
                    </tr>
                    <tr>
                      <RowHeader>
                        {t(
                          DEFAULT_LOCALE,
                          "user.collected.stats.details.rows.rank"
                        )}
                      </RowHeader>
                      {totalColumns.map((column) => (
                        <RankCell
                          key={column.key}
                          balance={column.balance}
                          rank={column.balanceRank}
                        />
                      ))}
                    </tr>
                    <UserPageStatsTableHr span={6} />
                    <tr>
                      <RowHeader>
                        {t(
                          DEFAULT_LOCALE,
                          "user.collected.stats.details.rows.tdh"
                        )}
                      </RowHeader>
                      {totalColumns.map((column) =>
                        column.hasTdh ? (
                          <NumberCell
                            key={column.key}
                            value={roundedTdhValue(column.tdh, !!ownerBalance)}
                          />
                        ) : (
                          <MutedCell key={column.key}>*</MutedCell>
                        )
                      )}
                    </tr>
                    <tr>
                      <RowHeader>
                        {t(
                          DEFAULT_LOCALE,
                          "user.collected.stats.details.rows.rank"
                        )}
                      </RowHeader>
                      {totalColumns.map((column) =>
                        column.hasTdh ? (
                          <RankCell
                            key={column.key}
                            balance={column.tdh}
                            rank={column.tdhRank}
                          />
                        ) : (
                          <MutedCell key={column.key}>
                            {t(
                              DEFAULT_LOCALE,
                              "user.collected.stats.details.rows.noTdh"
                            )}
                          </MutedCell>
                        )
                      )}
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Container>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

function UserPageStatsCollectedMemes({
  balanceMemes,
  seasons,
}: {
  readonly balanceMemes: OwnerBalanceMemes[];
  readonly seasons: MemeSeason[];
}) {
  const memeColumns = [
    t(DEFAULT_LOCALE, "user.collected.stats.details.tables.column.total"),
    t(DEFAULT_LOCALE, "user.collected.stats.details.tables.column.unique"),
    t(DEFAULT_LOCALE, "user.collected.stats.details.tables.column.sets"),
    t(DEFAULT_LOCALE, "user.collected.stats.details.rows.tdh"),
  ];

  function getDisplayWithValueAndRank(value: number, rank: number) {
    if (!value) {
      return "-";
    }
    if (!rank) {
      return formatInteger(DEFAULT_LOCALE, value);
    }

    return (
      <>
        {formatInteger(DEFAULT_LOCALE, value)}{" "}
        <span className="!tw-text-[#93939f]">
          (#{formatInteger(DEFAULT_LOCALE, rank)})
        </span>
      </>
    );
  }

  function getUniqueDisplay(balanceMemes: OwnerBalanceMemes) {
    const seasonBalance = seasons.find(
      (season) => season.id === balanceMemes.season
    );
    if (!seasonBalance) {
      return formatInteger(DEFAULT_LOCALE, balanceMemes.unique);
    }
    return (
      <>
        {t(DEFAULT_LOCALE, "user.collected.stats.details.uniqueProgress", {
          held: balanceMemes.unique
            ? formatInteger(DEFAULT_LOCALE, balanceMemes.unique)
            : "0",
          total: formatInteger(DEFAULT_LOCALE, seasonBalance.count),
        })}{" "}
        <span className="!tw-text-[#93939f]">
          {t(
            DEFAULT_LOCALE,
            "user.collected.stats.details.uniqueProgressPercent",
            {
              percent: formatPercent(
                DEFAULT_LOCALE,
                balanceMemes.unique / seasonBalance.count,
                0
              ),
            }
          )}
        </span>
      </>
    );
  }

  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles["collectedAccordionButton"]}>
          <b>
            {t(DEFAULT_LOCALE, "user.collected.stats.details.memesBySeason")}
          </b>
        </Accordion.Button>
        <Accordion.Body className={styles["collectedAccordionBody"]}>
          <Container>
            <Row className={`pt-2 pb-2 ${styles["scrollContainer"]}`}>
              <Col>
                {balanceMemes && (
                  <Table className={styles["collectedAccordionTable"]}>
                    <caption className="tw-sr-only">
                      {t(
                        DEFAULT_LOCALE,
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
                            className="text-right !tw-text-[#93939f]"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {balanceMemes.map((balanceMeme) => (
                        <Fragment
                          key={`stats-collected-memes-${balanceMeme.season}`}
                        >
                          <UserPageStatsTableHr span={6} />
                          <tr>
                            <th
                              scope="row"
                              colSpan={2}
                              className="!tw-text-[#93939f]"
                            >
                              {t(
                                DEFAULT_LOCALE,
                                "user.collected.stats.details.seasonLabel",
                                { seasonNumber: balanceMeme.season }
                              )}
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
                              {formatInteger(DEFAULT_LOCALE, balanceMeme.sets)}
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
                  </Table>
                )}
              </Col>
            </Row>
          </Container>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
