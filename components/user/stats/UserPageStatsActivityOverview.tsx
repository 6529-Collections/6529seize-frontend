"use client";

import type {
    AggregatedActivity,
    AggregatedActivityMemes,
} from "@/entities/IAggregatedActivity";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { numberWithCommas } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { Fragment, useEffect, useState } from "react";
import { Accordion, Col, Container, Row, Table } from "react-bootstrap";
import { getStatsPath } from "./userPageStats.helpers";
import styles from "./UserPageStats.module.scss";
import {
    UserPageStatsTableHead,
    UserPageStatsTableHr,
} from "./UserPageStatsTableShared";

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
    const controller = new AbortController();
    const url = `aggregated-activity/${getStatsPath(profile, activeAddress)}`;
    commonApiFetch<AggregatedActivity>({
      endpoint: url,
      signal: controller.signal,
    })
      .then(setActivity)
      .catch(() => {
        setActivity(undefined);
      });
    return () => controller.abort();
  }, [activeAddress, profile]);

  useEffect(() => {
    const controller = new AbortController();
    const url = `aggregated-activity/${getStatsPath(
      profile,
      activeAddress
    )}/memes`;
    commonApiFetch<AggregatedActivityMemes[]>({
      endpoint: url,
      signal: controller.signal,
    })
      .then((response) => {
        setActivityMemes(response);
      })
      .catch(() => {
        setActivityMemes([]);
      });
    return () => controller.abort();
  }, [activeAddress, profile]);

  return (
    <div className="pt-2 pb-2">
      <div className="tw-flex pt-2 pb-2">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
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


function UserPageStatsActivityOverviewTotals({
  activity,
}: {
  readonly activity: AggregatedActivity | undefined;
}) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles["collectedAccordionButton"]}>
          <b>Overview</b>
        </Accordion.Button>
        <Accordion.Body className={styles["collectedAccordionBody"]}>
          <Container>
            <Row className={`pt-2 pb-2 ${styles["scrollContainer"]}`}>
              <Col>
                <Table className={styles["collectedAccordionTable"]}>
                  <UserPageStatsTableHead />
                  <tbody>
                    <UserPageStatsTableHr span={6} />
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Airdrops</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.airdrops)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.airdrops_memes)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.airdrops_nextgen)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.airdrops_gradients)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.airdrops_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Transfers In</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_in)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_in_memes)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_in_nextgen)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_in_gradients)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_in_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Mints</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.primary_purchases_count)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(
                          activity?.primary_purchases_count_memes
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(
                          activity?.primary_purchases_count_nextgen
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(
                          activity?.primary_purchases_count_gradients
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(
                          activity?.primary_purchases_count_memelab
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Mints (ETH)</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(activity?.primary_purchases_value)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(activity?.primary_purchases_value_memes)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(
                          activity?.primary_purchases_value_nextgen
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(
                          activity?.primary_purchases_value_gradients
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(
                          activity?.primary_purchases_value_memelab
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Purchases</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.secondary_purchases_count)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(
                          activity?.secondary_purchases_count_memes
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(
                          activity?.secondary_purchases_count_nextgen
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(
                          activity?.secondary_purchases_count_gradients
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(
                          activity?.secondary_purchases_count_memelab
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Purchases (ETH)</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(activity?.secondary_purchases_value)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(
                          activity?.secondary_purchases_value_memes
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(
                          activity?.secondary_purchases_value_nextgen
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(
                          activity?.secondary_purchases_value_gradients
                        )}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(
                          activity?.secondary_purchases_value_memelab
                        )}
                      </td>
                    </tr>
                    <UserPageStatsTableHr span={6} />
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Transfers Out</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_out)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_out_memes)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_out_nextgen)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_out_gradients)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.transfers_out_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Burns</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.burns)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.burns_memes)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.burns_nextgen)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.burns_gradients)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.burns_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Sales</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.sales_count)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.sales_count_memes)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.sales_count_nextgen)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.sales_count_gradients)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {numberWithCommas(activity?.sales_count_memelab)}
                      </td>
                    </tr>
                    <tr>
                      <td className="!tw-text-[#93939f]">
                        <b>Sales (ETH)</b>
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(activity?.sales_value)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(activity?.sales_value_memes)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(activity?.sales_value_nextgen)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
                        {printEthValue(activity?.sales_value_gradients)}
                      </td>
                      <td className="tw-text-right !tw-text-[#fff]">
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
        <Accordion.Button className={styles["collectedAccordionButton"]}>
          <b>Memes Breakdown By Season</b>
        </Accordion.Button>
        <Accordion.Body className={styles["collectedAccordionBody"]}>
          <Container>
            <Row className={`pt-2 pb-2 ${styles["scrollContainer"]}`}>
              <Col>
                {activity && (
                  <Table className={styles["collectedAccordionTable"]}>
                    <thead>
                      <tr>
                        <th colSpan={1}></th>
                        <th className="text-right !tw-text-[#93939f]">
                          Transfers In
                        </th>
                        <th className="text-right !tw-text-[#93939f]">
                          Airdrops
                        </th>
                        <th className="text-right !tw-text-[#93939f]">Mints</th>
                        <th className="text-right !tw-text-[#93939f]">
                          Mints (ETH)
                        </th>
                        <th className="text-right !tw-text-[#93939f]">
                          Purchases
                        </th>
                        <th className="text-right !tw-text-[#93939f]">
                          Purchases (ETH)
                        </th>
                        <th className="text-right !tw-text-[#93939f]">
                          Transfers Out
                        </th>
                        <th className="text-right !tw-text-[#93939f]">Burns</th>
                        <th className="text-right !tw-text-[#93939f]">Sales</th>
                        <th className="text-right !tw-text-[#93939f]">
                          Sales (ETH)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((activity) => (
                        <Fragment
                          key={`stats-activity-memes-${activity.season}`}>
                          <UserPageStatsTableHr span={11} />
                          <tr>
                            <td className="!tw-text-[#93939f]">
                              Season {activity.season}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
                              {numberWithCommas(activity.transfers_in)}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
                              {numberWithCommas(activity.airdrops)}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
                              {numberWithCommas(
                                activity.primary_purchases_count
                              )}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
                              {printEthValue(activity.primary_purchases_value)}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
                              {numberWithCommas(
                                activity.secondary_purchases_count
                              )}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
                              {printEthValue(
                                activity.secondary_purchases_value
                              )}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
                              {numberWithCommas(activity.transfers_out)}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
                              {numberWithCommas(activity.burns)}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
                              {numberWithCommas(activity.sales_count)}
                            </td>
                            <td className="tw-text-right !tw-text-[#fff]">
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
