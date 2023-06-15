import styles from "./UserPage.module.scss";
import { Container, Row, Accordion, Table } from "react-bootstrap";
import { numberWithCommas } from "../../helpers/Helpers";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { useEffect, useState } from "react";

interface Props {
  tdh: ConsolidatedTDHMetrics | TDHMetrics | undefined;
}

export default function UserPageOverview(props: Props) {
  const [showActivity, setShowActivity] = useState<boolean>(false);

  useEffect(() => {
    if (props.tdh) {
      setShowActivity(
        props.tdh.transfers_in > 0 ||
          props.tdh.transfers_out > 0 ||
          props.tdh.purchases_count > 0 ||
          props.tdh.sales_count > 0
      );
    }
  }, [props.tdh]);

  return (
    <Container className="pt-5 pb-3">
      {props.tdh && props.tdh.balance > 0 && (
        <Row>
          <Accordion alwaysOpen className={styles.userPageAccordion}>
            <Accordion.Item
              className={styles.userPageAccordionItem}
              eventKey={"0"}>
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
                        <b>6529 Gradient</b>
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
                          props.tdh.memes_balance + props.tdh.gradients_balance
                        )}
                      </td>
                      <td>
                        {props.tdh.memes_balance > 0
                          ? `x${numberWithCommas(props.tdh.memes_balance)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.memes_balance_season1 > 0
                          ? `x${numberWithCommas(
                              props.tdh.memes_balance_season1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.memes_balance_season2 > 0
                          ? `x${numberWithCommas(
                              props.tdh.memes_balance_season2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.memes_balance_season3 > 0
                          ? `x${numberWithCommas(
                              props.tdh.memes_balance_season3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.gradients_balance > 0
                          ? `x${numberWithCommas(props.tdh.gradients_balance)}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Rank</b>
                      </td>
                      <td>
                        #{numberWithCommas(props.tdh.dense_rank_balance)}
                        {props.tdh.dense_rank_balance__ties > 1 && ` (tie)`}
                      </td>
                      <td>
                        {props.tdh.memes_balance > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_balance_memes
                            )}${
                              props.tdh.dense_rank_balance_memes__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.memes_balance_season1 > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_balance_memes_season1
                            )}${
                              props.tdh.dense_rank_balance_memes_season1__ties >
                              1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.memes_balance_season2 > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_balance_memes_season2
                            )}${
                              props.tdh.dense_rank_balance_memes_season2__ties >
                              1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.memes_balance_season3 > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_balance_memes_season3
                            )}${
                              props.tdh.dense_rank_balance_memes_season3__ties >
                              1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.gradients_balance > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_balance_gradients
                            )}${
                              props.tdh.dense_rank_balance_gradients__ties > 1
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
                          props.tdh.unique_memes + props.tdh.gradients_balance
                        )}
                      </td>
                      <td>
                        {props.tdh.unique_memes > 0
                          ? `x${numberWithCommas(props.tdh.unique_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.unique_memes_szn1 > 0
                          ? `x${numberWithCommas(props.tdh.unique_memes_szn1)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.unique_memes_szn2 > 0
                          ? `x${numberWithCommas(props.tdh.unique_memes_szn2)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.unique_memes_szn3 > 0
                          ? `x${numberWithCommas(props.tdh.unique_memes_szn3)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.gradients_balance > 0
                          ? `x${numberWithCommas(props.tdh.gradients_balance)}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Rank</b>
                      </td>
                      <td>
                        #{numberWithCommas(props.tdh.dense_rank_unique)}
                        {props.tdh.dense_rank_unique__ties > 1 && ` (tie)`}
                      </td>
                      <td>
                        {props.tdh.memes_balance > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_unique_memes
                            )}${
                              props.tdh.dense_rank_unique_memes__ties > 1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.memes_balance_season1 > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_unique_memes_season1
                            )}${
                              props.tdh.dense_rank_unique_memes_season1__ties >
                              1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.memes_balance_season2 > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_unique_memes_season2
                            )}${
                              props.tdh.dense_rank_unique_memes_season2__ties >
                              1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.memes_balance_season3 > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_unique_memes_season3
                            )}${
                              props.tdh.dense_rank_unique_memes_season3__ties >
                              1
                                ? ` (tie)`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.gradients_balance > 0
                          ? `#${numberWithCommas(
                              props.tdh.dense_rank_balance_gradients
                            )}${
                              props.tdh.dense_rank_balance_gradients__ties > 1
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
                      <td>{numberWithCommas(props.tdh.boosted_tdh)}</td>
                      <td>
                        {numberWithCommas(
                          Math.round(props.tdh.boosted_memes_tdh)
                        )}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(props.tdh.boosted_memes_tdh_season1)
                        )}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(props.tdh.boosted_memes_tdh_season2)
                        )}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(props.tdh.boosted_memes_tdh_season3)
                        )}
                      </td>
                      <td>
                        {numberWithCommas(
                          Math.round(props.tdh.boosted_gradients_tdh)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Rank</b>
                      </td>
                      <td>
                        {props.tdh.tdh_rank > 0
                          ? `#${numberWithCommas(props.tdh.tdh_rank)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.tdh_rank_memes > 0
                          ? `#${numberWithCommas(props.tdh.tdh_rank_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.tdh_rank_memes_szn1 > 0
                          ? `#${numberWithCommas(
                              props.tdh.tdh_rank_memes_szn1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.tdh_rank_memes_szn2 > 0
                          ? `#${numberWithCommas(
                              props.tdh.tdh_rank_memes_szn2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.tdh_rank_memes_szn3 > 0
                          ? `#${numberWithCommas(
                              props.tdh.tdh_rank_memes_szn3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.tdh_rank_gradients > 0
                          ? `#${numberWithCommas(props.tdh.tdh_rank_gradients)}`
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
      {showActivity && props.tdh && (
        <Row>
          <Accordion alwaysOpen className={styles.userPageAccordion}>
            <Accordion.Item
              className={`${styles.userPageAccordionItem} mt-4`}
              eventKey={"1"}>
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
                        <b>6529 Gradient</b>
                      </td>
                    </tr>
                    <tr className={styles.primaryTableGap}></tr>
                    <tr>
                      <td>
                        <b>Transfers In</b>
                      </td>
                      <td>
                        {props.tdh.transfers_in > 0
                          ? `x${numberWithCommas(props.tdh.transfers_in)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_in_memes > 0
                          ? `x${numberWithCommas(props.tdh.transfers_in_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_in_memes_season1 > 0
                          ? `x${numberWithCommas(
                              props.tdh.transfers_in_memes_season1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_in_memes_season2 > 0
                          ? `x${numberWithCommas(
                              props.tdh.transfers_in_memes_season2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_in_memes_season3 > 0
                          ? `x${numberWithCommas(
                              props.tdh.transfers_in_memes_season3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_in_gradients > 0
                          ? `x${numberWithCommas(
                              props.tdh.transfers_in_gradients
                            )}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Purchases</b>
                      </td>
                      <td>
                        {props.tdh.purchases_count > 0
                          ? `x${numberWithCommas(props.tdh.purchases_count)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_count_memes > 0
                          ? `x${numberWithCommas(
                              props.tdh.purchases_count_memes
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_count_memes_season1 > 0
                          ? `x${numberWithCommas(
                              props.tdh.purchases_count_memes_season1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_count_memes_season2 > 0
                          ? `x${numberWithCommas(
                              props.tdh.purchases_count_memes_season2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_count_memes_season3 > 0
                          ? `x${numberWithCommas(
                              props.tdh.purchases_count_memes_season3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_count_gradients > 0
                          ? `x${numberWithCommas(
                              props.tdh.purchases_count_gradients
                            )}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Purchases (ETH)</b>
                      </td>
                      <td>
                        {props.tdh.purchases_value > 0
                          ? `${numberWithCommas(
                              Math.round(props.tdh.purchases_value * 100) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_value_memes > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.tdh.purchases_value_memes * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_value_memes_season1 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.tdh.purchases_value_memes_season1 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_value_memes_season2 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.tdh.purchases_value_memes_season2 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_value_memes_season3 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.tdh.purchases_value_memes_season3 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.purchases_value_gradients > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.tdh.purchases_value_gradients * 100
                              ) / 100
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
                        {props.tdh.transfers_out > 0
                          ? `x${numberWithCommas(props.tdh.transfers_out)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_out_memes > 0
                          ? `x${numberWithCommas(
                              props.tdh.transfers_out_memes
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_out_memes_season1 > 0
                          ? `x${numberWithCommas(
                              props.tdh.transfers_out_memes_season1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_out_memes_season2 > 0
                          ? `x${numberWithCommas(
                              props.tdh.transfers_out_memes_season2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_out_memes_season3 > 0
                          ? `x${numberWithCommas(
                              props.tdh.transfers_out_memes_season3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.transfers_out_gradients > 0
                          ? `x${numberWithCommas(
                              props.tdh.transfers_out_gradients
                            )}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Sales</b>
                      </td>
                      <td>
                        {props.tdh.sales_count > 0
                          ? `x${numberWithCommas(props.tdh.sales_count)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_count_memes > 0
                          ? `x${numberWithCommas(props.tdh.sales_count_memes)}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_count_memes_season1 > 0
                          ? `x${numberWithCommas(
                              props.tdh.sales_count_memes_season1
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_count_memes_season2 > 0
                          ? `x${numberWithCommas(
                              props.tdh.sales_count_memes_season2
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_count_memes_season3 > 0
                          ? `x${numberWithCommas(
                              props.tdh.sales_count_memes_season3
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_count_gradients > 0
                          ? `x${numberWithCommas(
                              props.tdh.sales_count_gradients
                            )}`
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Sales (ETH)</b>
                      </td>
                      <td>
                        {props.tdh.sales_value > 0
                          ? `${numberWithCommas(
                              Math.round(props.tdh.sales_value * 100) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_value_memes > 0
                          ? `${numberWithCommas(
                              Math.round(props.tdh.sales_value_memes * 100) /
                                100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_value_memes_season1 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.tdh.sales_value_memes_season1 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_value_memes_season2 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.tdh.sales_value_memes_season2 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_value_memes_season3 > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.tdh.sales_value_memes_season3 * 100
                              ) / 100
                            )}`
                          : "-"}
                      </td>
                      <td>
                        {props.tdh.sales_value_gradients > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.tdh.sales_value_gradients * 100
                              ) / 100
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
