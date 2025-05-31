import styles from "./UserPageStats.module.scss";
import { numberWithCommas } from "../../../helpers/Helpers";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
import { Accordion, Container, Row, Col, Table } from "react-bootstrap";
import {
  AggregatedActivity,
  AggregatedActivityMemes,
} from "../../../entities/IAggregatedActivity";
import { Fragment, useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";
import {
  UserPageStatsTableHead,
  UserPageStatsTableHr,
} from "./UserPageStatsTableShared";
import { getStatsPath } from "./UserPageStats";

function printEthValue(value: number | undefined) {
  if (value === undefined) {
    return "-";
  }
  return numberWithCommas(Math.round(value * 100) / 100);
}

export default function UserPageStatsActivityOverview({
  profile,
  activeAddress,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
}) {
  const [activity, setActivity] = useState<AggregatedActivity | undefined>();
  const [activityMemes, setActivityMemes] = useState<AggregatedActivityMemes[]>(
    []
  );

  useEffect(() => {
    const url = `aggregated-activity/${getStatsPath(profile, activeAddress)}`;
    commonApiFetch<AggregatedActivity>({
      endpoint: url,
    })
      .then((response) => {
        setActivity(response);
      })
      .catch((error) => {
        setActivity(undefined);
      });
  }, [activeAddress, profile]);

  useEffect(() => {
    const url = `aggregated-activity/${getStatsPath(
      profile,
      activeAddress
    )}/memes`;
    commonApiFetch<AggregatedActivityMemes[]>({
      endpoint: url,
    }).then((response) => {
      setActivityMemes(response);
    });
  }, [activeAddress, profile]);

  return (
    <div className="pt-2 pb-2">
      <div className="tw-flex pt-2 pb-2">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Activity Overview
        </h3>
      </div>
      <div className="pt-2 pb-2">
        <UserPageStatsActivityOverviewTotals activity={activity} />
      </div>
      <div className="pt-2 pb-2">
        <UserPageStatsActivityOverviewMemes activity={activityMemes} />
      </div>
    </div>
  );
}

// Export helper for testing
export { printEthValue };

function UserPageStatsActivityOverviewTotals({
  activity,
}: {
  readonly activity: AggregatedActivity | undefined;
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
                        <b>Airdrops</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.airdrops)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.airdrops_memes)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.airdrops_nextgen)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.airdrops_gradients)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.airdrops_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Transfers In</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_in)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_in_memes)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_in_nextgen)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_in_gradients)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_in_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Mints</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.primary_purchases_count)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(
                          activity?.primary_purchases_count_memes
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(
                          activity?.primary_purchases_count_nextgen
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(
                          activity?.primary_purchases_count_gradients
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(
                          activity?.primary_purchases_count_memelab
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Mints (ETH)</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(activity?.primary_purchases_value)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(activity?.primary_purchases_value_memes)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(
                          activity?.primary_purchases_value_nextgen
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(
                          activity?.primary_purchases_value_gradients
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(
                          activity?.primary_purchases_value_memelab
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Purchases</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.secondary_purchases_count)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(
                          activity?.secondary_purchases_count_memes
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(
                          activity?.secondary_purchases_count_nextgen
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(
                          activity?.secondary_purchases_count_gradients
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(
                          activity?.secondary_purchases_count_memelab
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Purchases (ETH)</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(activity?.secondary_purchases_value)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(
                          activity?.secondary_purchases_value_memes
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(
                          activity?.secondary_purchases_value_nextgen
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(
                          activity?.secondary_purchases_value_gradients
                        )}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(
                          activity?.secondary_purchases_value_memelab
                        )}
                      </td>
                    </tr>
                    <UserPageStatsTableHr span={6} />
                    <tr>
                      <td>
                        <b>Transfers Out</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_out)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_out_memes)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_out_nextgen)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_out_gradients)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.transfers_out_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Burns</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.burns)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.burns_memes)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.burns_nextgen)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.burns_gradients)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.burns_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Sales</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.sales_count)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.sales_count_memes)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.sales_count_nextgen)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.sales_count_gradients)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {numberWithCommas(activity?.sales_count_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Sales (ETH)</b>
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(activity?.sales_value)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(activity?.sales_value_memes)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(activity?.sales_value_nextgen)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(activity?.sales_value_gradients)}
                      </td>
                      <td className={styles.collectedAccordionTableValue}>
                        {printEthValue(activity?.sales_value_memelab)}
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

function UserPageStatsActivityOverviewMemes({
  activity,
}: {
  readonly activity: AggregatedActivityMemes[];
}) {
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
                {activity && (
                  <Table className={styles.collectedAccordionTable}>
                    <thead>
                      <tr>
                        <th colSpan={1}></th>
                        <th className="text-right">Transfers In</th>
                        <th className="text-right">Airdrops</th>
                        <th className="text-right">Mints</th>
                        <th className="text-right">Mints (ETH)</th>
                        <th className="text-right">Purchases</th>
                        <th className="text-right">Purchases (ETH)</th>
                        <th className="text-right">Transfers Out</th>
                        <th className="text-right">Burns</th>
                        <th className="text-right">Sales</th>
                        <th className="text-right">Sales (ETH)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((activity) => (
                        <Fragment
                          key={`stats-activity-memes-${activity.season}`}>
                          <UserPageStatsTableHr span={11} />
                          <tr>
                            <td>Season {activity.season}</td>
                            <td className={styles.collectedAccordionTableValue}>
                              {numberWithCommas(activity.transfers_in)}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {numberWithCommas(activity.airdrops)}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {numberWithCommas(
                                activity.primary_purchases_count
                              )}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {printEthValue(activity.primary_purchases_value)}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {numberWithCommas(
                                activity.secondary_purchases_count
                              )}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {printEthValue(
                                activity.secondary_purchases_value
                              )}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {numberWithCommas(activity.transfers_out)}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {numberWithCommas(activity.burns)}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {numberWithCommas(activity.sales_count)}
                            </td>
                            <td className={styles.collectedAccordionTableValue}>
                              {printEthValue(activity.sales_value)}
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
