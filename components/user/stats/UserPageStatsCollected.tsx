import styles from "./UserPageStats.module.scss";
import { Accordion, Container, Row, Col, Table } from "react-bootstrap";
import { OwnerBalance, OwnerBalanceMemes } from "../../../entities/IBalances";
import { numberWithCommas } from "../../../helpers/Helpers";
import { MemeSeason } from "../../../entities/ISeason";
import {
  UserPageStatsTableHead,
  UserPageStatsTableHr,
} from "./UserPageStatsTableShared";
import { Fragment } from "react";

function getRankDisplay(balance: number | undefined, rank: number | undefined) {
  if (!balance || !rank) {
    return "-";
  }
  return `#${numberWithCommas(rank)}`;
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
      <div className="tw-flex pt-2 pb-2">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Collected
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
        <Accordion.Button className={styles.collectedAccordionButton}>
          <b>Overview</b>
        </Accordion.Button>
        <Accordion.Body className={styles.collectedAccordionBody}>
          <Container>
            <Row className={`pt-2 pb-2 ${styles.scrollContainer}`}>
              <Col>
                <Table className={styles.collectedAccordionTable}>
                  <UserPageStatsTableHead />
                  <tbody>
                    <UserPageStatsTableHr span={6} />
                    <tr>
                      <td>
                        <b>Cards</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(ownerBalance?.total_balance)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(ownerBalance?.memes_balance)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(ownerBalance?.nextgen_balance)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(ownerBalance?.gradients_balance)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(ownerBalance?.memelab_balance)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Rank</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {getRankDisplay(
                          ownerBalance?.total_balance,
                          ownerBalance?.total_balance_rank
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {getRankDisplay(
                          ownerBalance?.memes_balance,
                          ownerBalance?.memes_balance_rank
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {getRankDisplay(
                          ownerBalance?.nextgen_balance,
                          ownerBalance?.nextgen_balance_rank
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {getRankDisplay(
                          ownerBalance?.gradients_balance,
                          ownerBalance?.gradients_balance_rank
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {getRankDisplay(
                          ownerBalance?.memelab_balance,
                          ownerBalance?.memelab_balance_rank
                        )}
                      </td>
                    </tr>
                    <UserPageStatsTableHr span={6} />
                    <tr>
                      <td>
                        <b>TDH</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {ownerBalance
                          ? numberWithCommas(
                              Math.round(ownerBalance.boosted_tdh)
                            )
                          : "-"}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {ownerBalance
                          ? numberWithCommas(
                              Math.round(ownerBalance?.boosted_memes_tdh)
                            )
                          : "-"}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {ownerBalance
                          ? numberWithCommas(
                              Math.round(ownerBalance?.boosted_nextgen_tdh)
                            )
                          : "-"}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {ownerBalance
                          ? numberWithCommas(
                              Math.round(ownerBalance?.boosted_gradients_tdh)
                            )
                          : "-"}
                      </td>
                      <td className="text-right">*</td>
                    </tr>
                    <tr>
                      <td>
                        <b>Rank</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {getRankDisplay(
                          ownerBalance?.boosted_tdh,
                          ownerBalance?.boosted_tdh_rank
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {getRankDisplay(
                          ownerBalance?.boosted_memes_tdh,
                          ownerBalance?.boosted_memes_tdh_rank
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {getRankDisplay(
                          ownerBalance?.boosted_nextgen_tdh,
                          ownerBalance?.boosted_nextgen_tdh_rank
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {getRankDisplay(
                          ownerBalance?.boosted_gradients_tdh,
                          ownerBalance?.boosted_gradients_tdh_rank
                        )}
                      </td>
                      <td className="text-right">* No TDH</td>
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
      return numberWithCommas(value);
    }

    return (
      <>
        {numberWithCommas(value)}{" "}
        <span className={styles.fadedColor}>(#{numberWithCommas(rank)})</span>
      </>
    );
  }

  function getUniqueDisplay(balanceMemes: OwnerBalanceMemes) {
    const seasonBalance = seasons.find(
      (season) => season.id === balanceMemes.season
    );
    if (!seasonBalance) {
      return numberWithCommas(balanceMemes.unique);
    }
    return (
      <>
        {balanceMemes.unique ? numberWithCommas(balanceMemes.unique) : `0`} /{" "}
        {numberWithCommas(seasonBalance.count)}{" "}
        <span className={styles.fadedColor}>
          ({((balanceMemes.unique / seasonBalance.count) * 100).toFixed(0)}%)
        </span>
      </>
    );
  }

  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles.collectedAccordionButton}>
          <b>Memes Breakdown By Season</b>
        </Accordion.Button>
        <Accordion.Body className={styles.collectedAccordionBody}>
          <Container>
            <Row className={`pt-2 pb-2 ${styles.scrollContainer}`}>
              <Col>
                {balanceMemes && (
                  <Table className={styles.collectedAccordionTable}>
                    <thead>
                      <tr>
                        <th colSpan={2}></th>
                        <th className="text-right">Total</th>
                        <th className="text-right">Unique</th>
                        <th className="text-right">Sets</th>
                        <th className="text-right">TDH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balanceMemes.map((balanceMeme) => (
                        <Fragment
                          key={`stats-collected-memes-${balanceMeme.season}`}>
                          <UserPageStatsTableHr span={6} />
                          <tr>
                            <td colSpan={2}>Season {balanceMeme.season}</td>
                            <td className={styles.collectedAccordionTableValue}>
                              {getDisplayWithValueAndRank(
                                balanceMeme.balance,
                                balanceMeme.rank
                              )}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {getUniqueDisplay(balanceMeme)}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {numberWithCommas(balanceMeme.sets)}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
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
