import styles from "../UserPage.module.scss";
import { Container, Row, Accordion, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import { numberWithCommas } from "../../../helpers/Helpers";

export default function UserPageStatsOverview({
  tdh,
  loading,
}: {
  readonly tdh: ConsolidatedTDHMetrics | TDHMetrics | null;
  readonly loading: boolean;
}) {
  const [showActivity, setShowActivity] = useState<boolean>(false);

  useEffect(() => {
    if (tdh) {
      setShowActivity(
        tdh.transfers_in > 0 ||
          tdh.transfers_out > 0 ||
          tdh.purchases_count > 0 ||
          tdh.sales_count > 0
      );
    }
  }, [tdh]);

  return (
    <Container className="no-padding tw-mt-8">
      {tdh && tdh.balance > 0 && (
        <Row>
          <Accordion defaultActiveKey="0" className={styles.userPageAccordion}>
            <Accordion.Item
              className={styles.userPageAccordionItem}
              eventKey={"0"}
            >
              <Accordion.Header>Cards Collected</Accordion.Header>
              <Accordion.Body className={styles.primaryTableScrollContainer}>
                <Table className={styles.primaryTable}>
                  <tbody>
                    <tr>
                      <td></td>
                      <td>
                        <b>Total</b>
                      </td>
                      <td>
                        <b>Memes</b>
                      </td>
                      <td>
                        <b>SZN1</b>
                      </td>
                      <td>
                        <b>SZN2</b>
                      </td>
                      <td>
                        <b>SZN3</b>
                      </td>
                      <td>
                        <b>SZN4</b>
                      </td>
                      <td>
                        <b>SZN5</b>
                      </td>
                      <td>
                        <b>Gradient</b>
                      </td>
                    </tr>
                    <tr className={styles.primaryTableGap}></tr>
                    <tr>
                      <td>
                        <b>All Cards</b>
                      </td>
                      <td>
                        x
                        {numberWithCommas(
                          tdh.memes_balance + tdh.gradients_balance
                        )}
                      </td>
                      <td>
                        {tdh.memes_balance > 0
                          ? `x${numberWithCommas(tdh.memes_balance)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season1 > 0
                          ? `x${numberWithCommas(tdh.memes_balance_season1)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season2 > 0
                          ? `x${numberWithCommas(tdh.memes_balance_season2)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season3 > 0
                          ? `x${numberWithCommas(tdh.memes_balance_season3)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season4 > 0
                          ? `x${numberWithCommas(tdh.memes_balance_season4)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season5 > 0
                          ? `x${numberWithCommas(tdh.memes_balance_season5)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.gradients_balance > 0
                          ? `x${numberWithCommas(tdh.gradients_balance)}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Rank</b>
                      </td>
                      <td>
                        #{numberWithCommas(tdh.dense_rank_balance)}
                        {tdh.dense_rank_balance__ties > 1 && ` (tie)`}
                      </td>
                      <td>
                        {tdh.memes_balance > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_balance_memes
                            )}${
                              tdh.dense_rank_balance_memes__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season1 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_balance_memes_season1
                            )}${
                              tdh.dense_rank_balance_memes_season1__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season2 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_balance_memes_season2
                            )}${
                              tdh.dense_rank_balance_memes_season2__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season3 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_balance_memes_season3
                            )}${
                              tdh.dense_rank_balance_memes_season3__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season4 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_balance_memes_season4
                            )}${
                              tdh.dense_rank_balance_memes_season4__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season5 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_balance_memes_season5
                            )}${
                              tdh.dense_rank_balance_memes_season5__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.gradients_balance > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_balance_gradients
                            )}${
                              tdh.dense_rank_balance_gradients__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                    </tr>
                    <tr className={styles.primaryTableGap}></tr>
                    <tr>
                      <td>
                        <b>Unique Cards</b>
                      </td>
                      <td>
                        x
                        {numberWithCommas(
                          tdh.unique_memes + tdh.gradients_balance
                        )}
                      </td>
                      <td>
                        {tdh.unique_memes > 0
                          ? `x${numberWithCommas(tdh.unique_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.unique_memes_szn1 > 0
                          ? `x${numberWithCommas(tdh.unique_memes_szn1)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.unique_memes_szn2 > 0
                          ? `x${numberWithCommas(tdh.unique_memes_szn2)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.unique_memes_szn3 > 0
                          ? `x${numberWithCommas(tdh.unique_memes_szn3)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.unique_memes_szn4 > 0
                          ? `x${numberWithCommas(tdh.unique_memes_szn4)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.unique_memes_szn5 > 0
                          ? `x${numberWithCommas(tdh.unique_memes_szn5)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.gradients_balance > 0
                          ? `x${numberWithCommas(tdh.gradients_balance)}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Rank</b>
                      </td>
                      <td>
                        #{numberWithCommas(tdh.dense_rank_unique)}
                        {tdh.dense_rank_unique__ties > 1 && ` (tie)`}
                      </td>
                      <td>
                        {tdh.memes_balance > 0
                          ? `#${numberWithCommas(tdh.dense_rank_unique_memes)}${
                              tdh.dense_rank_unique_memes__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season1 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_unique_memes_season1
                            )}${
                              tdh.dense_rank_unique_memes_season1__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season2 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_unique_memes_season2
                            )}${
                              tdh.dense_rank_unique_memes_season2__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season3 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_unique_memes_season3
                            )}${
                              tdh.dense_rank_unique_memes_season3__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season4 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_unique_memes_season4
                            )}${
                              tdh.dense_rank_unique_memes_season4__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.memes_balance_season5 > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_unique_memes_season5
                            )}${
                              tdh.dense_rank_unique_memes_season5__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {tdh.gradients_balance > 0
                          ? `#${numberWithCommas(
                              tdh.dense_rank_balance_gradients
                            )}${
                              tdh.dense_rank_balance_gradients__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                    </tr>
                    <tr className={styles.primaryTableGap}></tr>
                    <tr>
                      <td>
                        <b>TDH</b>
                      </td>
                      <td>{numberWithCommas(tdh.boosted_tdh)}</td>
                      <td>
                        {numberWithCommas(Math.round(tdh.boosted_memes_tdh))}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(tdh.boosted_memes_tdh_season1)
                        )}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(tdh.boosted_memes_tdh_season2)
                        )}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(tdh.boosted_memes_tdh_season3)
                        )}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(tdh.boosted_memes_tdh_season4)
                        )}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(tdh.boosted_memes_tdh_season5)
                        )}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(tdh.boosted_gradients_tdh)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Rank</b>
                      </td>
                      <td>
                        {tdh.tdh_rank > 0
                          ? `#${numberWithCommas(tdh.tdh_rank)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.tdh_rank_memes > 0
                          ? `#${numberWithCommas(tdh.tdh_rank_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.tdh_rank_memes_szn1 > 0
                          ? `#${numberWithCommas(tdh.tdh_rank_memes_szn1)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.tdh_rank_memes_szn2 > 0
                          ? `#${numberWithCommas(tdh.tdh_rank_memes_szn2)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.tdh_rank_memes_szn3 > 0
                          ? `#${numberWithCommas(tdh.tdh_rank_memes_szn3)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.tdh_rank_memes_szn4 > 0
                          ? `#${numberWithCommas(tdh.tdh_rank_memes_szn4)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.tdh_rank_memes_szn5 > 0
                          ? `#${numberWithCommas(tdh.tdh_rank_memes_szn5)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.tdh_rank_gradients > 0
                          ? `#${numberWithCommas(tdh.tdh_rank_gradients)}`
                          : "-"}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Row>
      )}
      {showActivity && tdh && (
        <Row>
          <Accordion className={styles.userPageAccordion}>
            <Accordion.Item
              className={`${styles.userPageAccordionItem} mt-4`}
              eventKey={"1"}
            >
              <Accordion.Header>Activity Overview</Accordion.Header>
              <Accordion.Body className={styles.primaryTableScrollContainer}>
                <Table className={styles.primaryTableActivity}>
                  <tbody>
                    <tr>
                      <td></td>
                      <td>
                        <b>Total</b>
                      </td>
                      <td>
                        <b>Memes</b>
                      </td>
                      <td>
                        <b>SZN1</b>
                      </td>
                      <td>
                        <b>SZN2</b>
                      </td>
                      <td>
                        <b>SZN3</b>
                      </td>
                      <td>
                        <b>SZN4</b>
                      </td>
                      <td>
                        <b>SZN5</b>
                      </td>
                      <td>
                        <b>Gradient</b>
                      </td>
                    </tr>
                    <tr className={styles.primaryTableGap}></tr>
                    <tr>
                      <td>
                        <b>Transfers In</b>
                      </td>
                      <td>
                        {tdh.transfers_in > 0
                          ? `x${numberWithCommas(tdh.transfers_in)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_in_memes > 0
                          ? `x${numberWithCommas(tdh.transfers_in_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_in_memes_season1 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_in_memes_season1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_in_memes_season2 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_in_memes_season2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_in_memes_season3 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_in_memes_season3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_in_memes_season4 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_in_memes_season4
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_in_memes_season5 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_in_memes_season5
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_in_gradients > 0
                          ? `x${numberWithCommas(tdh.transfers_in_gradients)}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Purchases</b>
                      </td>
                      <td>
                        {tdh.purchases_count > 0
                          ? `x${numberWithCommas(tdh.purchases_count)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_count_memes > 0
                          ? `x${numberWithCommas(tdh.purchases_count_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_count_memes_season1 > 0
                          ? `x${numberWithCommas(
                              tdh.purchases_count_memes_season1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_count_memes_season2 > 0
                          ? `x${numberWithCommas(
                              tdh.purchases_count_memes_season2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_count_memes_season3 > 0
                          ? `x${numberWithCommas(
                              tdh.purchases_count_memes_season3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_count_memes_season4 > 0
                          ? `x${numberWithCommas(
                              tdh.purchases_count_memes_season4
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_count_memes_season5 > 0
                          ? `x${numberWithCommas(
                              tdh.purchases_count_memes_season5
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_count_gradients > 0
                          ? `x${numberWithCommas(
                              tdh.purchases_count_gradients
                            )}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Purchases (ETH)</b>
                      </td>
                      <td>
                        {tdh.purchases_value > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.purchases_value * 100) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_value_memes > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.purchases_value_memes * 100) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_value_memes_season1 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                tdh.purchases_value_memes_season1 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_value_memes_season2 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                tdh.purchases_value_memes_season2 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_value_memes_season3 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                tdh.purchases_value_memes_season3 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_value_memes_season4 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                tdh.purchases_value_memes_season4 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_value_memes_season5 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                tdh.purchases_value_memes_season5 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.purchases_value_gradients > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.purchases_value_gradients * 100) /
                                100
                            )}`
                          : "-"}
                      </td>
                    </tr>
                    <tr className={styles.primaryTableGap}></tr>
                    <tr>
                      <td>
                        <b>Transfers Out</b>
                      </td>
                      <td>
                        {tdh.transfers_out > 0
                          ? `x${numberWithCommas(tdh.transfers_out)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_out_memes > 0
                          ? `x${numberWithCommas(tdh.transfers_out_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_out_memes_season1 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_out_memes_season1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_out_memes_season2 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_out_memes_season2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_out_memes_season3 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_out_memes_season3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_out_memes_season4 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_out_memes_season4
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_out_memes_season5 > 0
                          ? `x${numberWithCommas(
                              tdh.transfers_out_memes_season5
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.transfers_out_gradients > 0
                          ? `x${numberWithCommas(tdh.transfers_out_gradients)}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Sales</b>
                      </td>
                      <td>
                        {tdh.sales_count > 0
                          ? `x${numberWithCommas(tdh.sales_count)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_count_memes > 0
                          ? `x${numberWithCommas(tdh.sales_count_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_count_memes_season1 > 0
                          ? `x${numberWithCommas(
                              tdh.sales_count_memes_season1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_count_memes_season2 > 0
                          ? `x${numberWithCommas(
                              tdh.sales_count_memes_season2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_count_memes_season3 > 0
                          ? `x${numberWithCommas(
                              tdh.sales_count_memes_season3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_count_memes_season4 > 0
                          ? `x${numberWithCommas(
                              tdh.sales_count_memes_season4
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_count_memes_season5 > 0
                          ? `x${numberWithCommas(
                              tdh.sales_count_memes_season5
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_count_gradients > 0
                          ? `x${numberWithCommas(tdh.sales_count_gradients)}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Sales (ETH)</b>
                      </td>
                      <td>
                        {tdh.sales_value > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.sales_value * 100) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_value_memes > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.sales_value_memes * 100) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_value_memes_season1 > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.sales_value_memes_season1 * 100) /
                                100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_value_memes_season2 > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.sales_value_memes_season2 * 100) /
                                100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_value_memes_season3 > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.sales_value_memes_season3 * 100) /
                                100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_value_memes_season4 > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.sales_value_memes_season4 * 100) /
                                100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_value_memes_season5 > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.sales_value_memes_season5 * 100) /
                                100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {tdh.sales_value_gradients > 0
                          ? `${numberWithCommas(
                              Math.round(tdh.sales_value_gradients * 100) / 100
                            )}`
                          : "-"}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Row>
      )}
    </Container>
  );
}
