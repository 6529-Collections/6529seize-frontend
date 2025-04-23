import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./Leaderboard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cicToType, numberWithCommas } from "../../helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";
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
}

export const PAGE_SIZE = 25;

export async function fetchNftTdhResults(
  contract: string,
  nftId: number,
  walletFilter: string,
  page: number,
  sort: string,
  sort_direction: string
) {
  const url = `tdh/nft`;
  const results = await commonApiFetch<{
    count: number;
    page: number;
    next: any;
    data: NftTDH[];
  }>({
    endpoint: `${url}/${contract}/${nftId}?${walletFilter}&page_size=${PAGE_SIZE}&page=${page}&sort=${sort}&sort_direction=${sort_direction}`,
  });
  results.data.forEach((lead: NftTDH) => {
    lead.cic_type = cicToType(lead.cic_score);
  });
  return results;
}

export function setScrollPosition() {
  const top = document.getElementById("nft-leaderboard")?.offsetTop;
  if (top && window.scrollY > 0) {
    window.scrollTo({
      top: top,
      behavior: "smooth",
    });
  }
}

enum Sort {
  balance = "balance",
  tdh__raw = "tdh__raw",
  boosted_tdh = "boosted_tdh",
  total_balance = "total_balance",
  total_tdh__raw = "total_tdh__raw",
  total_boosted_tdh = "total_boosted_tdh",
}

interface NftTDH {
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
  primary_wallet: string;
  level: number;
  cic_type?: CICType;
}

export interface NftTDHRanked extends NftTDH {
  rank: number;
}

export default function NFTLeaderboard(props: Readonly<Props>) {
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<NftTDHRanked[]>([]);
  const [fetchingLeaderboard, setFetchingLeaderboard] = useState(true);
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.balance, sort_direction: SortDirection.DESC });

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  async function fetchResults() {
    setFetchingLeaderboard(true);
    let walletFilter = "";
    if (searchWallets && searchWallets.length > 0) {
      walletFilter = `&search=${searchWallets.join(",")}`;
    }
    const response = await fetchNftTdhResults(
      props.contract,
      props.nftId,
      walletFilter,
      page,
      sort.sort,
      sort.sort_direction
    );
    setTotalResults(response.count);
    const data: NftTDHRanked[] = response.data.map((lead, index) => {
      const rank =
        searchWallets.length > 0
          ? lead.tdh_rank
          : index + 1 + (page - 1) * PAGE_SIZE;
      return { ...lead, rank };
    });
    setLeaderboard(data);
    setScrollPosition();
    setFetchingLeaderboard(false);
  }

  useEffect(() => {
    if (page === 1) {
      fetchResults();
    } else {
      setPage(1);
    }
  }, [sort, searchWallets]);

  useEffect(() => {
    fetchResults();
  }, [page]);

  return (
    <Container className={`no-padding pt-3`} id="nft-leaderboard">
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Network</span>
          </h1>
          <h1>&nbsp;Card {props.nftId}</h1>
        </Col>
      </Row>
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
              {leaderboard.map((lead) => {
                return (
                  <tr key={lead.consolidation_key}>
                    <td className={styles.rank}>
                      {numberWithCommas(lead.rank)}
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
                      {numberWithCommas(Math.round(lead.total_boosted_tdh))}
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
      {leaderboard.length === 0 && !fetchingLeaderboard && (
        <Row>
          <Col>No Results found</Col>
        </Row>
      )}
      {totalResults > 0 && (
        <Row className="text-center pt-2 pb-3">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
            }}
          />
        </Row>
      )}
      <SearchModalDisplay
        show={showSearchModal}
        setShow={setShowSearchModal}
        searchWallets={searchWallets}
        setSearchWallets={setSearchWallets}
      />
    </Container>
  );
}
