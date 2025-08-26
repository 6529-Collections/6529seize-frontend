"use client";

import { MemeSeason } from "@/entities/ISeason";
import { SortDirection } from "@/entities/ISort";
import { numberWithCommas } from "@/helpers/Helpers";
import { useState } from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import { Collector, Content } from "./Leaderboard";
import styles from "./Leaderboard.module.scss";
import {
  LeaderboardCardsCollectedSort,
  LeaderboardMetrics,
  useFetchLeaderboard,
} from "./leaderboard_helpers";
import { LeaderboardCollector } from "./LeaderboardCollector";
import LeaderboardFooter from "./LeaderboardDownload";
import LeaderboardSort from "./LeaderboardSort";

const PAGE_SIZE = 50;

interface Props {
  block: number | undefined;
  content: Content;
  collector: Collector;
  selectedSeason: number;
  searchWallets: string[];
  globalTdhRateChange?: number;
  seasons: MemeSeason[];
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export default function LeaderboardCardsCollectedComponent(
  props: Readonly<Props>
) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    sort: LeaderboardCardsCollectedSort;
    sort_direction: SortDirection;
  }>({
    sort: LeaderboardCardsCollectedSort.level,
    sort_direction: SortDirection.DESC,
  });

  const { myFetchUrl, totalResults, leaderboard } =
    useFetchLeaderboard<LeaderboardMetrics>(
      "tdh/consolidated_metrics",
      page,
      sort,
      {
        searchWallets: props.searchWallets,
        content: props.content,
        collector: props.collector,
        selectedSeason: props.selectedSeason,
      },
      props.setIsLoading
    );

  function getTDHChange(lead: LeaderboardMetrics) {
    if (!lead.total_tdh) {
      return "";
    }

    const tdhChange = (lead.day_change / lead.total_tdh) * 100;
    return ` (${tdhChange.toFixed(2)}%)`;
  }

  function calculateTdhVsCommunity(lead: LeaderboardMetrics) {
    if (!props.globalTdhRateChange || !lead.day_change || !lead.total_tdh) {
      return "-";
    }
    const tdhChange = (lead.day_change / lead.total_tdh) * 100;
    return `${Math.abs(tdhChange / props.globalTdhRateChange).toFixed(2)}x`;
  }

  if (!leaderboard) {
    return <></>;
  }

  if (leaderboard.length === 0 && !props.isLoading) {
    return (
      <Container>
        <Row>
          <Col>No results found. Change filters and try again.</Col>
        </Row>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Row>
          <Col>
            <Table bordered={false} className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.rank}>Rank</th>
                  <th className={`${styles.hodlerContainer}`}>
                    <span>Collector</span>
                    <span className={styles.totalResults}>
                      {props.isLoading
                        ? "..."
                        : `x${totalResults.toLocaleString()}`}
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Level&nbsp;
                      <LeaderboardSort
                        sort_option={LeaderboardCardsCollectedSort.level}
                        sort={sort}
                        setSort={setSort}
                      />
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Cards Collected&nbsp;
                      <LeaderboardSort
                        sort_option={LeaderboardCardsCollectedSort.balance}
                        sort={sort}
                        setSort={setSort}
                      />
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Unique Memes&nbsp;
                      <LeaderboardSort
                        sort_option={LeaderboardCardsCollectedSort.unique_memes}
                        sort={sort}
                        setSort={setSort}
                      />
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Sets&nbsp;
                      <LeaderboardSort
                        sort_option={
                          LeaderboardCardsCollectedSort.memes_cards_sets
                        }
                        sort={sort}
                        setSort={setSort}
                      />
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      TDH&nbsp;
                      <LeaderboardSort
                        sort_option={LeaderboardCardsCollectedSort.boosted_tdh}
                        sort={sort}
                        setSort={setSort}
                      />
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Daily Change&nbsp;
                      <LeaderboardSort
                        sort_option={LeaderboardCardsCollectedSort.day_change}
                        sort={sort}
                        setSort={setSort}
                      />
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      vs Network&nbsp;
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((lead: LeaderboardMetrics, index) => {
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
          </Col>
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
