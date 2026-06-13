import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import { formatInteger, formatPercent } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { Fragment } from "react";
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
                      <th scope="row" className="!tw-text-[#93939f]">
                        <b>
                          {t(
                            DEFAULT_LOCALE,
                            "user.collected.stats.details.rows.cards"
                          )}
                        </b>
                      </th>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {formatInteger(
                          DEFAULT_LOCALE,
                          ownerBalance?.total_balance
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {formatInteger(
                          DEFAULT_LOCALE,
                          ownerBalance?.memes_balance
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {formatInteger(
                          DEFAULT_LOCALE,
                          ownerBalance?.nextgen_balance
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {formatInteger(
                          DEFAULT_LOCALE,
                          ownerBalance?.gradients_balance
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {formatInteger(
                          DEFAULT_LOCALE,
                          ownerBalance?.memelab_balance
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="!tw-text-[#93939f]">
                        <b>
                          {t(
                            DEFAULT_LOCALE,
                            "user.collected.stats.details.rows.rank"
                          )}
                        </b>
                      </th>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {getRankDisplay(
                          ownerBalance?.total_balance,
                          ownerBalance?.total_balance_rank
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {getRankDisplay(
                          ownerBalance?.memes_balance,
                          ownerBalance?.memes_balance_rank
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {getRankDisplay(
                          ownerBalance?.nextgen_balance,
                          ownerBalance?.nextgen_balance_rank
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {getRankDisplay(
                          ownerBalance?.gradients_balance,
                          ownerBalance?.gradients_balance_rank
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {getRankDisplay(
                          ownerBalance?.memelab_balance,
                          ownerBalance?.memelab_balance_rank
                        )}
                      </td>
                    </tr>
                    <UserPageStatsTableHr span={6} />
                    <tr>
                      <th scope="row" className="!tw-text-[#93939f]">
                        <b>
                          {t(
                            DEFAULT_LOCALE,
                            "user.collected.stats.details.rows.tdh"
                          )}
                        </b>
                      </th>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {ownerBalance
                          ? formatInteger(
                              DEFAULT_LOCALE,
                              Math.round(ownerBalance.boosted_tdh)
                            )
                          : "-"}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {ownerBalance
                          ? formatInteger(
                              DEFAULT_LOCALE,
                              Math.round(ownerBalance?.boosted_memes_tdh)
                            )
                          : "-"}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {ownerBalance
                          ? formatInteger(
                              DEFAULT_LOCALE,
                              Math.round(ownerBalance?.boosted_nextgen_tdh)
                            )
                          : "-"}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {ownerBalance
                          ? formatInteger(
                              DEFAULT_LOCALE,
                              Math.round(ownerBalance?.boosted_gradients_tdh)
                            )
                          : "-"}
                      </td>
                      <td className="text-right !tw-text-[#93939f]">*</td>
                    </tr>
                    <tr>
                      <th scope="row" className="!tw-text-[#93939f]">
                        <b>
                          {t(
                            DEFAULT_LOCALE,
                            "user.collected.stats.details.rows.rank"
                          )}
                        </b>
                      </th>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {getRankDisplay(
                          ownerBalance?.boosted_tdh,
                          ownerBalance?.boosted_tdh_rank
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {getRankDisplay(
                          ownerBalance?.boosted_memes_tdh,
                          ownerBalance?.boosted_memes_tdh_rank
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {getRankDisplay(
                          ownerBalance?.boosted_nextgen_tdh,
                          ownerBalance?.boosted_nextgen_tdh_rank
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {getRankDisplay(
                          ownerBalance?.boosted_gradients_tdh,
                          ownerBalance?.boosted_gradients_tdh_rank
                        )}
                      </td>
                      <td className="text-right !tw-text-[#93939f]">
                        {t(
                          DEFAULT_LOCALE,
                          "user.collected.stats.details.rows.noTdh"
                        )}
                      </td>
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
                        <th
                          scope="col"
                          className="text-right !tw-text-[#93939f]"
                        >
                          {t(
                            DEFAULT_LOCALE,
                            "user.collected.stats.details.tables.column.total"
                          )}
                        </th>
                        <th
                          scope="col"
                          className="text-right !tw-text-[#93939f]"
                        >
                          {t(
                            DEFAULT_LOCALE,
                            "user.collected.stats.details.tables.column.unique"
                          )}
                        </th>
                        <th
                          scope="col"
                          className="text-right !tw-text-[#93939f]"
                        >
                          {t(
                            DEFAULT_LOCALE,
                            "user.collected.stats.details.tables.column.sets"
                          )}
                        </th>
                        <th
                          scope="col"
                          className="text-right !tw-text-[#93939f]"
                        >
                          {t(
                            DEFAULT_LOCALE,
                            "user.collected.stats.details.rows.tdh"
                          )}
                        </th>
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
