import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./Leaderboard.module.scss";
import { numberWithCommas } from "../../helpers/Helpers";
import { SortDirection } from "../../entities/ISort";
import { LeaderboardCollector } from "./LeaderboardCollector";
import { CICType } from "../../entities/IProfile";
import { MemeSeason } from "../../entities/ISeason";
import {
  Collector,
  Content,
  fetchLeaderboardData,
  getLeaderboardDownloadFileName,
} from "./Leaderboard";
import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import Pagination from "../pagination/Pagination";
import LeaderboardSort, {
  LeaderboardCardsCollectedSort,
} from "./LeaderboardSort";

const PAGE_SIZE = 50;

interface Props {
  block: number | undefined;
  content: Content;
  collector: Collector;
  selectedSeason: number;
  searchWallets: string[];
  globalTdhRateChange?: number;
  seasons: MemeSeason[];
  setIsLoading: (isLoading: boolean) => void;
}

export interface LeaderboardMetrics {
  handle: string;
  consolidation_key: string;
  consolidation_display: string;
  pfp_url: string;
  balance: number;
  unique_memes: number;
  unique_memes_total: number;
  memes_cards_sets: number;
  rep_score: number;
  cic_score: number;
  primary_wallet: string;
  boosted_tdh: number;
  day_change: number;
  level: number;
  cic_type?: CICType;
}

export default function LeaderboardCardsCollected(props: Readonly<Props>) {
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardMetrics[]>();
  const [sort, setSort] = useState<{
    sort: LeaderboardCardsCollectedSort;
    sort_direction: SortDirection;
  }>({
    sort: LeaderboardCardsCollectedSort.level,
    sort_direction: SortDirection.DESC,
  });

  const [myFetchUrl, setMyFetchUrl] = useState<string>("");

  async function fetchResults() {
    setMyFetchUrl("");
    props.setIsLoading(true);
    const data: {
      count: number;
      data: LeaderboardMetrics[];
      url: string;
    } = await fetchLeaderboardData(
      "tdh/consolidated_metrics",
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

  function getTDHChange(lead: LeaderboardMetrics) {
    if (!lead.boosted_tdh) {
      return "";
    }

    const tdhChange = (lead.day_change / lead.boosted_tdh) * 100;
    return ` (${tdhChange.toFixed(2)}%)`;
  }

  function calculateTdhVsCommunity(lead: LeaderboardMetrics) {
    if (!props.globalTdhRateChange || !lead.day_change || !lead.boosted_tdh) {
      return "-";
    }
    const tdhChange = (lead.day_change / lead.boosted_tdh) * 100;
    return `${(tdhChange / props.globalTdhRateChange).toFixed(2)}x`;
  }

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

  return (
    <Container>
      <Row>
        <Col></Col>
        <Table bordered={false} className={styles.leaderboardTable}>
          <thead>
            <tr>
              <th className={styles.rank}>Rank</th>
              <th className={`${styles.hodlerContainer}`}>
                Collector&nbsp;&nbsp;
                <span className={styles.totalResults}>
                  x{totalResults.toLocaleString()}
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Level&nbsp;
                  <LeaderboardSort
                    sort={sort}
                    setSort={setSort}
                    s={LeaderboardCardsCollectedSort.level}
                  />
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Cards Collected&nbsp;
                  <LeaderboardSort
                    sort={sort}
                    setSort={setSort}
                    s={LeaderboardCardsCollectedSort.balance}
                  />
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Unique Memes&nbsp;
                  <LeaderboardSort
                    sort={sort}
                    setSort={setSort}
                    s={LeaderboardCardsCollectedSort.unique_memes}
                  />
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Sets&nbsp;
                  <LeaderboardSort
                    sort={sort}
                    setSort={setSort}
                    s={LeaderboardCardsCollectedSort.memes_cards_sets}
                  />
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  TDH&nbsp;
                  <LeaderboardSort
                    sort={sort}
                    setSort={setSort}
                    s={LeaderboardCardsCollectedSort.boosted_tdh}
                  />
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Daily Change&nbsp; &nbsp;
                  <LeaderboardSort
                    sort={sort}
                    setSort={setSort}
                    s={LeaderboardCardsCollectedSort.day_change}
                  />
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  vs Community&nbsp; &nbsp;
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard &&
              leaderboard.map((lead: LeaderboardMetrics, index) => {
                return (
                  <tr key={lead.consolidation_key}>
                    <td className={styles.rank}>
                      {/* {lead.tdh_rank} */}
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

                    <td className={styles.tdhSub}>{lead.level}</td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.balance)}
                    </td>
                    <td className={styles.tdhSub}>
                      {lead.unique_memes
                        ? numberWithCommas(lead.unique_memes)
                        : 0}{" "}
                      / {numberWithCommas(lead.unique_memes_total)} (
                      {Math.round(
                        (lead.unique_memes / lead.unique_memes_total) * 100
                      )}
                      %)
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.memes_cards_sets)}
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(Math.round(lead.boosted_tdh))}
                    </td>
                    <td className={styles.tdhSub}>
                      {!lead.day_change ? (
                        "-"
                      ) : (
                        <>
                          {lead.day_change > 0 ? `+` : ``}
                          {numberWithCommas(lead.day_change)}
                          {lead.day_change != 0 && (
                            <span className={styles.tdhBoost}>
                              {getTDHChange(lead)}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className={styles.tdhSub}>
                      {!lead.day_change
                        ? "-"
                        : `${calculateTdhVsCommunity(lead)}`}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Row>
      {totalResults > 0 && leaderboard && myFetchUrl && (
        <Row>
          <Col
            xs={12}
            sm={12}
            md={6}
            className="pt-4 pb-3 d-flex justify-content-center gap-4">
            <DownloadUrlWidget
              preview="Page"
              name={getLeaderboardDownloadFileName(
                "community-cards-collected",
                props.block ?? 0,
                page
              )}
              url={`${myFetchUrl}&download_page=true`}
            />
            <DownloadUrlWidget
              preview="All Pages"
              name={getLeaderboardDownloadFileName(
                "community-cards-collected",
                props.block ?? 0,
                0
              )}
              url={`${myFetchUrl}&download_all=true`}
            />
          </Col>
          {totalResults > PAGE_SIZE && (
            <Col
              xs={12}
              sm={12}
              md={6}
              className="pt-4 pb-3 d-flex justify-content-center">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                totalResults={totalResults}
                setPage={function (newPage: number) {
                  setPage(newPage);
                }}
              />
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
}
