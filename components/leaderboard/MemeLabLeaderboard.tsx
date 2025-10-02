"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./Leaderboard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { numberWithCommas } from "@/helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "@/entities/ISort";
import { LeaderboardCollector } from "./LeaderboardCollector";
import {
  fetchNftTdhResults,
  PAGE_SIZE,
  NftTDHRanked,
  setScrollPosition,
} from "./NFTLeaderboard";
import {
  faSquareCaretUp,
  faSquareCaretDown,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  contract: string;
  nftId: number;
}

enum Sort {
  card_balance = "balance",
}

export default function MemeLabLeaderboard(props: Readonly<Props>) {
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<NftTDHRanked[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.card_balance, sort_direction: SortDirection.DESC });

  async function fetchResults() {
    setLeaderboardLoaded(false);
    const response = await fetchNftTdhResults(
      props.contract,
      props.nftId,
      "",
      page,
      sort.sort,
      sort.sort_direction
    );
    setTotalResults(response.count);
    const data: NftTDHRanked[] = response.data.map((lead, index) => {
      const rank = index + 1 + (page - 1) * PAGE_SIZE;
      return { ...lead, rank };
    });
    setLeaderboard(data);
    setScrollPosition();
    setLeaderboardLoaded(true);
  }

  useEffect(() => {
    if (page === 1) {
      fetchResults();
    } else {
      setPage(1);
    }
  }, [sort]);

  useEffect(() => {
    fetchResults();
  }, [page]);

  return (
    <Container className={`no-padding`} id="nft-leaderboard">
      <Row className={styles.scrollContainer}>
        <Col>
          <Table bordered={false} className={styles.memeLabLeaderboardTable}>
            <thead>
              <tr>
                <th className={styles.memeLabRank}>Rank</th>
                <th className={styles.memeLabHodler}>
                  Collector{" "}
                  {totalResults ? `x${totalResults.toLocaleString()}` : ""}
                </th>
                <th className={`${styles.memeLabBalance} text-center`}>
                  <span className="d-flex align-items-center justify-content-center">
                    Balance&nbsp;
                    <span className="d-flex flex-column">
                      <FontAwesomeIcon
                        icon={faSquareCaretUp}
                        onClick={() =>
                          setSort({
                            sort: Sort.card_balance,
                            sort_direction: SortDirection.ASC,
                          })
                        }
                        className={`${styles.caret} ${
                          sort.sort_direction != SortDirection.ASC ||
                          sort.sort != Sort.card_balance
                            ? styles.disabled
                            : ""
                        }`}
                      />
                      <FontAwesomeIcon
                        icon={faSquareCaretDown}
                        onClick={() =>
                          setSort({
                            sort: Sort.card_balance,
                            sort_direction: SortDirection.DESC,
                          })
                        }
                        className={`${styles.caret} ${
                          sort.sort_direction != SortDirection.DESC ||
                          sort.sort != Sort.card_balance
                            ? styles.disabled
                            : ""
                        }`}
                      />
                    </span>
                  </span>
                </th>
              </tr>
              <tr className={styles.gap}></tr>
            </thead>
            <tbody>
              <tr className={styles.gap}></tr>
              {leaderboard.map((lead) => {
                return (
                  <tr key={lead.consolidation_key}>
                    <td className={styles.rank}>
                      {numberWithCommas(lead.rank)}
                    </td>
                    <td className={styles.hodlerContainer}>
                      <div className={styles.hodler}>
                        <LeaderboardCollector
                          handle={lead.handle}
                          consolidationKey={lead.consolidation_key}
                          consolidationDisplay={lead.consolidation_display}
                          pfp={lead.pfp_url}
                          cicType={lead.cic_type}
                          level={lead.level}
                        />
                      </div>
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Col>
      </Row>
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
      {leaderboardLoaded && leaderboard.length === 0 && (
        <Row>
          <Col>No Results found</Col>
        </Row>
      )}
    </Container>
  );
}
