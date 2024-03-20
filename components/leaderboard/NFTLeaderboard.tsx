import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import styles from "./Leaderboard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cicToType, numberWithCommas } from "../../helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";
import { fetchUrl } from "../../services/6529api";
import { CICType } from "../../entities/IProfile";
import { LeaderboardCollector } from "./LeaderboardCollector";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "../searchModal/SearchModal";
import { commonApiFetch } from "../../services/api/common-api";

interface Props {
  contract: string;
  nftId: number;
  page: number;
  pageSize: number;
}

enum Sort {
  balance = "balance",
  tdh__raw = "tdh__raw",
  boosted_tdh = "boosted_tdh",
  total_balance = "total_balance",
  total_tdh__raw = "total_tdh__raw",
  total_boosted_tdh = "total_boosted_tdh",
}

export interface NftTDH {
  id: number;
  contract: string;
  handle: string;
  pfp_url: string;
  consolidation_key: string;
  consolidation_display: string;
  balance: number;
  tdh: number;
  boost: number;
  boosted_tdh: number;
  tdh__raw: number;
  tdh_rank: number;
  total_balance: number;
  total_tdh: number;
  total_tdh__raw: number;
  total_boosted_tdh: number;
  rep_score: number;
  cic_score: number;
  level: number;
  cic_type?: CICType;
}

export default function NFTLeaderboard(props: Readonly<Props>) {
  const [pageProps, setPageProps] = useState<Props>(props);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<NftTDH[]>();
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.balance, sort_direction: SortDirection.DESC });

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  async function fetchResults() {
    const url = `tdh/nft`;
    let walletFilter = "";
    if (searchWallets && searchWallets.length > 0) {
      walletFilter = `&search=${searchWallets.join(",")}`;
    }
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NftTDH[];
    }>({
      endpoint: `${url}/${props.contract}/${props.nftId}?${walletFilter}&page_size=${props.pageSize}&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}`,
    }).then((response) => {
      setTotalResults(response.count);
      response.data.forEach((lead: NftTDH) => {
        lead.cic_type = cicToType(lead.cic_score);
      });
      setLeaderboard(response.data);
      setLeaderboardLoaded(false);
    });
  }

  useEffect(() => {
    if (pageProps.page === 1) {
      fetchResults();
    } else {
      setPageProps({ ...pageProps, page: 1 });
    }
  }, [sort, searchWallets]);

  useEffect(() => {
    fetchResults();
  }, [pageProps.page]);

  return (
    <Container className={`no-padding pt-3`} id={`leaderboard-${props.nftId}`}>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Community</span>
          </h1>
          <h1>&nbsp;Card {props.nftId}</h1>
        </Col>
      </Row>

      {leaderboard && leaderboard.length > 0 && (
        <>
          <Row className="pt-2 pb-2">
            <Col className="d-flex justify-content-end align-items-center">
              <SearchWalletsDisplay
                searchWallets={searchWallets}
                setSearchWallets={setSearchWallets}
                setShowSearchModal={setShowSearchModal}
              />
            </Col>
          </Row>
          <Row className={styles.scrollContainer}>
            <Col>
              <Table bordered={false} className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th className={styles.rank}></th>
                    <th className={styles.hodlerContainer}></th>
                    <th className={styles.gap}></th>
                    <th
                      colSpan={3}
                      className={`${styles.tdh} ${styles.borderBottom}`}>
                      <b>This Card</b>
                    </th>
                    <th className={styles.gap}></th>
                    <th
                      colSpan={3}
                      className={`${styles.tdh} ${styles.borderBottom}`}>
                      <b>Total</b>
                    </th>
                  </tr>
                  <tr className={styles.gap}></tr>
                  <tr>
                    <th className={styles.rank}>Rank</th>
                    <th className={styles.hodlerContainer}>
                      Collector{" "}
                      {totalResults > 0 && `x${totalResults.toLocaleString()}`}
                    </th>
                    <th className={styles.gap}></th>
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        Balance&nbsp;
                        <span className="d-flex flex-column">
                          <FontAwesomeIcon
                            icon="square-caret-up"
                            onClick={() =>
                              setSort({
                                sort: Sort.balance,
                                sort_direction: SortDirection.ASC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.ASC ||
                              sort.sort != Sort.balance
                                ? styles.disabled
                                : ""
                            }`}
                          />
                          <FontAwesomeIcon
                            icon="square-caret-down"
                            onClick={() =>
                              setSort({
                                sort: Sort.balance,
                                sort_direction: SortDirection.DESC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.DESC ||
                              sort.sort != Sort.balance
                                ? styles.disabled
                                : ""
                            }`}
                          />
                        </span>
                      </span>
                    </th>
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        TDH&nbsp;
                        <span className="d-flex flex-column">
                          <FontAwesomeIcon
                            icon="square-caret-up"
                            onClick={() =>
                              setSort({
                                sort: Sort.boosted_tdh,
                                sort_direction: SortDirection.ASC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.ASC ||
                              sort.sort != Sort.boosted_tdh
                                ? styles.disabled
                                : ""
                            }`}
                          />
                          <FontAwesomeIcon
                            icon="square-caret-down"
                            onClick={() =>
                              setSort({
                                sort: Sort.boosted_tdh,
                                sort_direction: SortDirection.DESC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.DESC ||
                              sort.sort != Sort.boosted_tdh
                                ? styles.disabled
                                : ""
                            }`}
                          />
                        </span>
                      </span>
                    </th>
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        Unweighted TDH&nbsp;
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
                    <th className={styles.gap}></th>
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        Balance&nbsp;
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
                        TDH&nbsp;
                        <span className="d-flex flex-column">
                          <FontAwesomeIcon
                            icon="square-caret-up"
                            onClick={() =>
                              setSort({
                                sort: Sort.total_boosted_tdh,
                                sort_direction: SortDirection.ASC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.ASC ||
                              sort.sort != Sort.total_boosted_tdh
                                ? styles.disabled
                                : ""
                            }`}
                          />
                          <FontAwesomeIcon
                            icon="square-caret-down"
                            onClick={() =>
                              setSort({
                                sort: Sort.total_boosted_tdh,
                                sort_direction: SortDirection.DESC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.DESC ||
                              sort.sort != Sort.total_boosted_tdh
                                ? styles.disabled
                                : ""
                            }`}
                          />
                        </span>
                      </span>
                    </th>
                    <th className={styles.tdhSub}>
                      <span className="d-flex align-items-center justify-content-center">
                        Unweighted TDH&nbsp;
                        <span className="d-flex flex-column">
                          <FontAwesomeIcon
                            icon="square-caret-up"
                            onClick={() =>
                              setSort({
                                sort: Sort.total_tdh__raw,
                                sort_direction: SortDirection.ASC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.ASC ||
                              sort.sort != Sort.total_tdh__raw
                                ? styles.disabled
                                : ""
                            }`}
                          />
                          <FontAwesomeIcon
                            icon="square-caret-down"
                            onClick={() =>
                              setSort({
                                sort: Sort.total_tdh__raw,
                                sort_direction: SortDirection.DESC,
                              })
                            }
                            className={`${styles.caret} ${
                              sort.sort_direction != SortDirection.DESC ||
                              sort.sort != Sort.total_tdh__raw
                                ? styles.disabled
                                : ""
                            }`}
                          />
                        </span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard &&
                    leaderboard.map((lead, index) => {
                      const rank =
                        searchWallets.length > 0
                          ? lead.tdh_rank
                          : index +
                            1 +
                            (pageProps.page - 1) * pageProps.pageSize;
                      return (
                        <tr key={`${lead.consolidation_key}`}>
                          <td className={styles.rank}>
                            {numberWithCommas(rank)}
                          </td>
                          <td className={styles.hodlerContainer}>
                            <LeaderboardCollector
                              handle={lead.handle}
                              consolidationKey={lead.consolidation_key}
                              consolidationDisplay={lead.consolidation_display}
                              pfp={lead.pfp_url}
                              cicType={lead.cic_type}
                              level={lead.level}
                            />
                          </td>
                          <td className={styles.gap}></td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(lead.balance)}
                          </td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(Math.round(lead.boosted_tdh))}
                          </td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(Math.round(lead.tdh__raw))}
                          </td>
                          <td className={styles.gap}></td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(lead.total_balance)}
                          </td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(
                              Math.round(lead.total_boosted_tdh)
                            )}
                          </td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(Math.round(lead.total_tdh__raw))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </Col>
          </Row>
        </>
      )}
      {totalResults > 0 && (
        <>
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
          <SearchModalDisplay
            show={showSearchModal}
            setShow={setShowSearchModal}
            searchWallets={searchWallets}
            setSearchWallets={setSearchWallets}
          />
        </>
      )}
      {leaderboardLoaded && leaderboard?.length === 0 && (
        <Row>
          <Col>No TDH accrued</Col>
        </Row>
      )}
    </Container>
  );
}
