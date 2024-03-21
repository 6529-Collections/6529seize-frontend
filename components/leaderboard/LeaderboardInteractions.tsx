import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./Leaderboard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { numberWithCommas } from "../../helpers/Helpers";
import { SortDirection } from "../../entities/ISort";
import { LeaderboardCollector } from "./LeaderboardCollector";
import { CICType } from "../../entities/IProfile";
import { MemeSeason } from "../../entities/ISeason";
import { Collector, Content } from "./Leaderboard";
import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import Pagination from "../pagination/Pagination";
import LeaderboardSort from "./LeaderboardSort";
import {
  LeaderboardInteractionsSort,
  fetchLeaderboardData,
  getLeaderboardDownloadFileName,
} from "./leaderboard_helpers";
import LeaderboardFooter from "./LeaderboardDownload";

const PAGE_SIZE = 50;

interface Props {
  block: number | undefined;
  content: Content;
  collector: Collector;
  selectedSeason: number;
  searchWallets: string[];
  seasons: MemeSeason[];
  setIsLoading: (isLoading: boolean) => void;
}

export interface LeaderboardInteractions {
  handle: string;
  consolidation_key: string;
  consolidation_display: string;
  pfp_url: string;
  rep_score: number;
  cic_score: number;
  primary_wallet: string;
  boosted_tdh: number;
  day_change: number;
  level: number;
  primary_purchases_count: number;
  primary_purchases_value: number;
  secondary_purchases_count: number;
  secondary_purchases_value: number;
  sales_count: number;
  sales_value: number;
  transfers_in: number;
  transfers_out: number;
  airdrops: number;
  burns: number;
  cic_type?: CICType;
}

export default function LeaderboardInteractions(props: Readonly<Props>) {
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardInteractions[]>();
  const [sort, setSort] = useState<{
    sort: LeaderboardInteractionsSort;
    sort_direction: SortDirection;
  }>({
    sort: LeaderboardInteractionsSort.primary_purchases_count,
    sort_direction: SortDirection.DESC,
  });

  const [myFetchUrl, setMyFetchUrl] = useState<string>("");

  async function fetchResults() {
    setMyFetchUrl("");
    props.setIsLoading(true);
    const data: {
      count: number;
      data: LeaderboardInteractions[];
      url: string;
    } = await fetchLeaderboardData(
      "aggregated-activity",
      PAGE_SIZE,
      page,
      props.searchWallets,
      sort,
      props.content,
      props.collector,
      props.selectedSeason
    );
    setTotalResults(data.count);
    setLeaderboard(data.data);
    props.setIsLoading(false);
    setMyFetchUrl(`${process.env.API_ENDPOINT}/api/${data.url}`);
  }

  useEffect(() => {
    if (page === 1) {
      fetchResults();
    } else {
      setPage(1);
    }
  }, [
    sort,
    props.content,
    props.selectedSeason,
    props.searchWallets,
    props.collector,
  ]);

  useEffect(() => {
    fetchResults();
    const top = document.getElementById(`leaderboard-page`)?.offsetTop;
    if (top && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, [page]);

  if (!leaderboard) {
    return <></>;
  }

  if (leaderboard.length === 0) {
    return (
      <Container>
        <Row>
          <Col>No results found. Change filters and try again.</Col>
        </Row>
      </Container>
    );
  }

  function printHeader(s: LeaderboardInteractionsSort) {
    return <LeaderboardSort sort={sort} setSort={setSort} s={s} />;
  }

  return (
    <>
      <Container>
        <Row>
          <Col></Col>
          <Table bordered={false} className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th colSpan={2}></th>
                <th
                  colSpan={2}
                  className={`text-center ${styles.borderBottom}`}>
                  Primary Purchases
                </th>
                <th className={styles.gap}></th>
                <th
                  colSpan={2}
                  className={`text-center ${styles.borderBottom}`}>
                  Secondary Purchases
                </th>
                <th className={styles.gap}></th>
                <th
                  colSpan={2}
                  className={`text-center ${styles.borderBottom}`}>
                  Sales
                </th>
                <th className={styles.gap}></th>
                <th
                  colSpan={4}
                  className={`text-center ${styles.borderBottom}`}>
                  Transfers
                </th>
              </tr>
              <tr>
                <th className={styles.rank}>Rank</th>
                <th className={`${styles.hodlerContainer}`}>
                  Collector&nbsp;&nbsp;
                  <span className={styles.totalResults}>
                    x{totalResults.toLocaleString()}
                  </span>
                </th>
                {/* primary purchases */}
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    Count&nbsp;
                    {printHeader(
                      LeaderboardInteractionsSort.primary_purchases_count
                    )}
                  </span>
                </th>
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    Value&nbsp;
                    {printHeader(
                      LeaderboardInteractionsSort.primary_purchases_value
                    )}
                  </span>
                </th>
                <th className={styles.gap}></th>
                {/* secondary purchases */}
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    Count&nbsp;
                    {printHeader(
                      LeaderboardInteractionsSort.secondary_purchases_count
                    )}
                  </span>
                </th>
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    Value&nbsp;
                    {printHeader(
                      LeaderboardInteractionsSort.secondary_purchases_value
                    )}
                  </span>
                </th>
                <th className={styles.gap}></th>
                {/* sales */}
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    Count&nbsp;
                    {printHeader(LeaderboardInteractionsSort.sales_count)}
                  </span>
                </th>
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    Value&nbsp;
                    {printHeader(LeaderboardInteractionsSort.sales_value)}
                  </span>
                </th>
                <th className={styles.gap}></th>
                {/* transfers */}
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    Airdrops&nbsp;
                    {printHeader(LeaderboardInteractionsSort.airdrops)}
                  </span>
                </th>
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    In&nbsp;
                    {printHeader(LeaderboardInteractionsSort.transfers_in)}
                  </span>
                </th>
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    Out&nbsp;
                    {printHeader(LeaderboardInteractionsSort.transfers_out)}
                  </span>
                </th>
                <th className={styles.tdhSub}>
                  <span className="d-flex align-items-center justify-content-center">
                    Burns&nbsp;
                    {printHeader(LeaderboardInteractionsSort.burns)}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard &&
                leaderboard.map((lead: LeaderboardInteractions, index) => {
                  return (
                    <tr key={lead.consolidation_key}>
                      <td className={styles.rank}>
                        {numberWithCommas(index + 1 + (page - 1) * PAGE_SIZE)}
                      </td>
                      <td className="tw-max-w-[20px] tw-truncate">
                        <LeaderboardCollector
                          handle={lead.handle}
                          consolidationKey={lead.consolidation_key}
                          consolidationDisplay={lead.consolidation_display}
                          pfp={lead.pfp_url}
                          cicType={lead.cic_type}
                          level={lead.level}
                        />
                      </td>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(lead.primary_purchases_count)}
                      </td>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(
                          Math.round(lead.primary_purchases_value * 100) / 100
                        )}
                      </td>
                      <th className={styles.gap}></th>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(lead.secondary_purchases_count)}
                      </td>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(
                          Math.round(lead.secondary_purchases_value * 100) / 100
                        )}
                      </td>
                      <th className={styles.gap}></th>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(lead.sales_count)}
                      </td>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(
                          Math.round(lead.sales_value * 100) / 100
                        )}
                      </td>
                      <th className={styles.gap}></th>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(lead.airdrops)}
                      </td>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(lead.transfers_in)}
                      </td>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(lead.transfers_out)}
                      </td>
                      <td className={styles.tdhSub}>
                        {numberWithCommas(lead.burns)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </Table>
        </Row>
      </Container>
      <LeaderboardFooter
        url={myFetchUrl}
        totalResults={totalResults}
        page={page}
        pageSize={PAGE_SIZE}
        setPage={setPage}
        block={props.block}
      />
    </>
  );
}
