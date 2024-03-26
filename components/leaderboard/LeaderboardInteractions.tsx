import { useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./Leaderboard.module.scss";
import { numberWithCommas } from "../../helpers/Helpers";
import { SortDirection } from "../../entities/ISort";
import { LeaderboardCollector } from "./LeaderboardCollector";
import { MemeSeason } from "../../entities/ISeason";
import { Collector, Content } from "./Leaderboard";
import LeaderboardSort from "./LeaderboardSort";
import {
  LEADERBOARD_PAGE_SIZE,
  LeaderboardInteractions,
  LeaderboardInteractionsSort,
  useFetchLeaderboard,
} from "./leaderboard_helpers";
import LeaderboardFooter from "./LeaderboardDownload";

interface Props {
  block: number | undefined;
  content: Content;
  collector: Collector;
  selectedSeason: number;
  searchWallets: string[];
  seasons: MemeSeason[];
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export default function LeaderboardInteractionsComponent(
  props: Readonly<Props>
) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    sort: LeaderboardInteractionsSort;
    sort_direction: SortDirection;
  }>({
    sort: LeaderboardInteractionsSort.primary_purchases_count,
    sort_direction: SortDirection.DESC,
  });

  const { myFetchUrl, totalResults, leaderboard } =
    useFetchLeaderboard<LeaderboardInteractions>(
      "aggregated-activity",
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

  function printHeader(sortOption: LeaderboardInteractionsSort) {
    return (
      <LeaderboardSort sort_option={sortOption} sort={sort} setSort={setSort} />
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
                    <span>Collector</span>
                    <span className={styles.totalResults}>
                      {props.isLoading
                        ? "..."
                        : `x${totalResults.toLocaleString()}`}
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
                {leaderboard.map((lead: LeaderboardInteractions, index) => {
                  return (
                    <tr key={lead.consolidation_key}>
                      <td className={styles.rank}>
                        {numberWithCommas(
                          index + 1 + (page - 1) * LEADERBOARD_PAGE_SIZE
                        )}
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
          </Col>
        </Row>
      </Container>
      <LeaderboardFooter
        url={myFetchUrl}
        totalResults={totalResults}
        page={page}
        pageSize={LEADERBOARD_PAGE_SIZE}
        setPage={setPage}
        block={props.block}
      />
    </>
  );
}
