import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { TDH, TDHCalc, TDHMetrics } from "../../entities/ITDH";
import styles from "./Leaderboard.module.scss";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  areEqualAddresses,
  getDateDisplay,
  numberWithCommas,
} from "../../helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";
import { Owner, OwnerTags } from "../../entities/IOwner";
import { useRouter } from "next/router";

const Address = dynamic(() => import("../address/Address"), { ssr: false });

interface Props {
  page: number;
  pageSize: number;
  showMore?: boolean;
}

enum Sort {
  tdh_rank = "tdh_rank",
  tdh = "tdh",
  tdh__raw = "tdh__raw",
  szn1_tdh = "memes_tdh_season1",
  gradients_tdh = "gradients_tdh",
  total_balance = "balance",
  szn1_balance = "memes_balance_season1",
  gradients_balance = "gradients_balance",
  purchases_value = "purchases_value",
  sales_value = "sales_value",
  sales_count = "sales_count",
}

export default function Leaderboard(props: Props) {
  const router = useRouter();

  const [pageProps, setPageProps] = useState<Props>(props);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<TDHMetrics[]>();
  const [lastTDH, setLastTDH] = useState<TDHCalc>();
  const [next, setNext] = useState(null);
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.tdh_rank, sort_direction: SortDirection.ASC });
  const [showViewAll, setShowViewAll] = useState(
    !window.location.pathname.includes("community")
  );

  const [ownerTags, setOwnersTags] = useState<OwnerTags[]>([]);
  const [ownerTagsLoaded, setOwnerTagsLoaded] = useState(false);

  const [tdhExpanded, setTdhExpanded] = useState(false);

  async function fetchResults() {
    var top = document.getElementById(`leaderboard-page`)?.offsetTop;
    if (top && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
    fetch(
      `${process.env.API_ENDPOINT}/api/owner_metrics?page_size=${props.pageSize}&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}`
    )
      .then((res) => res.json())
      .then((response: DBResponse) => {
        setTotalResults(response.count);
        setNext(response.next);
        setLeaderboard(response.data);
      });
  }

  useEffect(() => {
    if (sort && router.isReady) {
      if (pageProps.page == 1) {
        fetchResults();
      } else {
        setPageProps({ ...pageProps, page: 1 });
      }
    }
  }, [sort, router.isReady]);

  useEffect(() => {
    fetch(`${process.env.API_ENDPOINT}/api/blocks?page_size=${1}`)
      .then((res) => res.json())
      .then((response: DBResponse) => {
        if (response.data.length > 0) {
          setLastTDH({
            block: response.data[0].block_number,
            date: new Date(response.data[0].timestamp),
          });
        }
      });
  }, []);

  useEffect(() => {
    fetchResults();
  }, [pageProps.page]);

  useEffect(() => {
    async function fetchOwnersTags(url: string, myowners: OwnerTags[]) {
      return fetch(url)
        .then((res) => res.json())
        .then((response: DBResponse) => {
          if (response.next) {
            fetchOwnersTags(response.next, [...myowners].concat(response.data));
          } else {
            const newOwnersTags = [...myowners].concat(response.data);
            setOwnersTags(newOwnersTags);
            setOwnerTagsLoaded(true);
          }
        });
    }

    if (leaderboard && router.isReady) {
      const uniqueWallets = leaderboard.map((l) => l.wallet);
      const initialUrlOwners = `${
        process.env.API_ENDPOINT
      }/api/owners_tags?wallet=${uniqueWallets.join(",")}`;
      fetchOwnersTags(initialUrlOwners, []);
    }
  }, [router.isReady, leaderboard]);

  return (
    <Container className={`no-padding pt-4`} id={`leaderboard-page`}>
      <Row>
        <Col className={styles.pageHeader}>
          <h1>
            COMMUNITY{" "}
            {showViewAll && (
              <a href="/community">
                <span className={styles.viewAllLink}>VIEW ALL</span>
              </a>
            )}
          </h1>
        </Col>
        {lastTDH && (
          <Col className={`${styles.lastTDH}`}>
            * LAST TDH: {getDateDisplay(lastTDH.date)} BLOCK:{" "}
            <a
              href={`https://etherscan.io/block/${lastTDH.block}`}
              rel="noreferrer"
              target="_blank">
              {lastTDH.block}
            </a>
          </Col>
        )}
      </Row>
      <Row className={styles.scrollContainer}>
        <Col>
          {leaderboard && leaderboard.length > 0 && (
            <Table bordered={false} className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.rank}></th>
                  <th className={styles.hodler}></th>
                  <th className={styles.gap}></th>
                  <th
                    colSpan={3}
                    className={`${styles.tdh} ${styles.borderBottom}`}>
                    <b>Total Cards HODLed</b>
                  </th>
                  <th className={styles.gap}></th>
                  <th
                    colSpan={3}
                    className={`${styles.tdh} ${styles.borderBottom}`}>
                    <b>Interactions</b>
                  </th>
                  <th className={styles.gap}></th>
                  <th
                    colSpan={tdhExpanded ? 6 : 3}
                    className={`${styles.tdh} ${styles.borderBottom}`}>
                    <b>Total Days HODLed (TDH)</b>
                    <FontAwesomeIcon
                      icon={
                        tdhExpanded
                          ? "chevron-circle-left"
                          : "chevron-circle-right"
                      }
                      onClick={() => setTdhExpanded(!tdhExpanded)}
                      className={`${styles.caretTDH} ${
                        sort.sort_direction != SortDirection.DESC
                      }`}
                    />
                  </th>
                </tr>
                <tr className={styles.gap}></tr>
                <tr>
                  <th className={styles.rank}>Rank</th>
                  <th className={styles.hodler}>HODLer</th>
                  <th className={styles.gap}></th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Total&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.total_balance,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.total_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.total_balance,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.total_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      SZN1&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.szn1_balance,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.szn1_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.szn1_balance,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.szn1_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Gradients&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.gradients_balance,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.gradients_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.gradients_balance,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.gradients_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.gap}></th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Purchases (ETH)&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.purchases_value,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.purchases_value
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.purchases_value,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.purchases_value
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Sales (ETH)&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.sales_value,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.sales_value
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.sales_value,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.sales_value
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Sales&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.sales_count,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.sales_count
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.sales_count,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.sales_count
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.gap}></th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Total&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.tdh_rank,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.tdh_rank
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.tdh_rank,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.tdh_rank
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  {tdhExpanded && (
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        Boost&nbsp;
                      </span>
                    </th>
                  )}
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Unboosted&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.tdh,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.tdh
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.tdh,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.tdh
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Unweighted&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.tdh__raw,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.tdh__raw
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.tdh__raw,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.tdh__raw
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  {tdhExpanded && (
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        SZN1&nbsp;
                        <span className="d-flex flex-column">
                          <FontAwesomeIcon
                            icon="square-caret-up"
                            onClick={() =>
                              setSort({
                                sort: Sort.szn1_tdh,
                                sort_direction: SortDirection.ASC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.ASC ||
                              sort.sort != Sort.szn1_tdh
                                ? styles.disabled
                                : ""
                            }`}
                          />
                          <FontAwesomeIcon
                            icon="square-caret-down"
                            onClick={() =>
                              setSort({
                                sort: Sort.szn1_tdh,
                                sort_direction: SortDirection.DESC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.DESC ||
                              sort.sort != Sort.szn1_tdh
                                ? styles.disabled
                                : ""
                            }`}
                          />
                        </span>
                      </span>
                    </th>
                  )}
                  {tdhExpanded && (
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        Gradients&nbsp;
                        <span className="d-flex flex-column">
                          <FontAwesomeIcon
                            icon="square-caret-up"
                            onClick={() =>
                              setSort({
                                sort: Sort.gradients_tdh,
                                sort_direction: SortDirection.ASC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.ASC ||
                              sort.sort != Sort.gradients_tdh
                                ? styles.disabled
                                : ""
                            }`}
                          />
                          <FontAwesomeIcon
                            icon="square-caret-down"
                            onClick={() =>
                              setSort({
                                sort: Sort.gradients_tdh,
                                sort_direction: SortDirection.DESC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.DESC ||
                              sort.sort != Sort.gradients_tdh
                                ? styles.disabled
                                : ""
                            }`}
                          />
                        </span>
                      </span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className={styles.gap}></tr>
                {leaderboard &&
                  ownerTagsLoaded &&
                  leaderboard.map((lead, index) => {
                    const tags = ownerTags.find((ot) =>
                      areEqualAddresses(ot.wallet, lead.wallet)
                    );
                    return (
                      <tr key={`${index}-${lead.wallet}`}>
                        <td className={styles.rank}>
                          {/* {lead.tdh_rank} */}
                          {index +
                            1 +
                            (pageProps.page - 1) * pageProps.pageSize}
                        </td>
                        <td className={styles.hodler}>
                          <Address
                            address={lead.wallet}
                            ens={lead.wallet_display}
                            tags={{
                              memesCardsSets: tags ? tags.memes_cards_sets : 0,
                              memesBalance: tags ? tags.unique_memes : 0,
                              gradientsBalance: tags
                                ? tags.gradients_balance
                                : 0,
                              genesis: tags ? tags.genesis : false,
                            }}
                          />
                        </td>
                        <td className={styles.gap}></td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(lead.balance)}
                        </td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(lead.memes_balance_season1)}
                        </td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(lead.gradients_balance)}
                        </td>
                        <td className={styles.gap}></td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(
                            Math.round(lead.purchases_value * 100) / 100
                          )}
                        </td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(
                            Math.round(lead.sales_value * 100) / 100
                          )}
                        </td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(lead.sales_count)}
                        </td>
                        <td className={styles.gap}></td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(lead.boosted_tdh)}
                        </td>
                        {tdhExpanded && (
                          <td className={styles.tdhSub}>
                            x{numberWithCommas(lead.boost)}
                          </td>
                        )}
                        <td className={styles.tdhSub}>
                          {numberWithCommas(lead.tdh)}
                        </td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(lead.tdh__raw)}
                        </td>
                        {tdhExpanded && (
                          <td className={styles.tdhSub}>
                            {numberWithCommas(lead.memes_tdh_season1)}
                          </td>
                        )}
                        {tdhExpanded && (
                          <td className={styles.tdhSub}>
                            {numberWithCommas(lead.gradients_tdh)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
      {props.showMore && totalResults > 0 && leaderboard && ownerTagsLoaded && (
        <Row className="text-center pt-2 pb-3">
          <Pagination
            page={pageProps.page}
            pageSize={pageProps.pageSize}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPageProps({ ...pageProps, page: newPage });
            }}
          />
        </Row>
      )}
    </Container>
  );
}
