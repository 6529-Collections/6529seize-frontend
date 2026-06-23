"use client";

import clsx from "clsx";
import { useState } from "react";
import styles from "./Leaderboard.module.scss";
import { numberWithCommas } from "@/helpers/Helpers";
import { SortDirection } from "@/entities/ISort";
import { LeaderboardCollector } from "./LeaderboardCollector";
import type { MemeSeason } from "@/entities/ISeason";
import type { Collector, Content } from "./Leaderboard";
import LeaderboardSort from "./LeaderboardSort";
import type { LeaderboardInteractions } from "./leaderboard_helpers";
import {
  LEADERBOARD_PAGE_SIZE,
  LeaderboardInteractionsSort,
  useFetchLeaderboard,
} from "./leaderboard_helpers";
import LeaderboardFooter from "./LeaderboardDownload";
import LeaderboardTableScrollShell from "./LeaderboardTableScrollShell";

const TABLE_CLASS_NAME = "tw-mb-0 tw-w-full tw-border-collapse tw-text-white";
const ROW_CLASS_NAME = "odd:tw-bg-[#1e1e1e] even:tw-bg-transparent";
const HEADER_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-p-2 tw-align-middle tw-font-semibold tw-leading-7 tw-text-white";
const BODY_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-p-2 tw-align-middle tw-leading-10 tw-text-white";
const HEADER_CONTENT_CLASS_NAME = "tw-flex tw-items-center tw-justify-center";
const RANK_CELL_CLASS_NAME = "tw-w-[4%] tw-text-center";
const COLLECTOR_CELL_CLASS_NAME = "tw-max-w-0 tw-w-[28%] tw-text-left";
const METRIC_CELL_CLASS_NAME = "tw-w-auto tw-text-center";
const GAP_CELL_CLASS_NAME = "tw-w-2 tw-p-0";
const GROUP_HEADER_CELL_CLASS_NAME =
  "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white tw-p-0 tw-text-center";

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
      <div className={styles["leaderboardEmpty"]}>
        No results found. Change filters and try again.
      </div>
    );
  }

  function printHeader(sortOption: LeaderboardInteractionsSort) {
    return (
      <LeaderboardSort sort_option={sortOption} sort={sort} setSort={setSort} />
    );
  }

  return (
    <>
      <LeaderboardTableScrollShell>
        <table className={clsx(TABLE_CLASS_NAME, styles["interactionsTable"])}>
          <thead>
            <tr>
              <th className={HEADER_CELL_CLASS_NAME} colSpan={2} />
              <th
                className={clsx(
                  HEADER_CELL_CLASS_NAME,
                  GROUP_HEADER_CELL_CLASS_NAME
                )}
                colSpan={2}
              >
                Primary Purchases
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, GAP_CELL_CLASS_NAME)}
              />
              <th
                className={clsx(
                  HEADER_CELL_CLASS_NAME,
                  GROUP_HEADER_CELL_CLASS_NAME
                )}
                colSpan={2}
              >
                Secondary Purchases
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, GAP_CELL_CLASS_NAME)}
              />
              <th
                className={clsx(
                  HEADER_CELL_CLASS_NAME,
                  GROUP_HEADER_CELL_CLASS_NAME
                )}
                colSpan={2}
              >
                Sales
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, GAP_CELL_CLASS_NAME)}
              />
              <th
                className={clsx(
                  HEADER_CELL_CLASS_NAME,
                  GROUP_HEADER_CELL_CLASS_NAME
                )}
                colSpan={4}
              >
                Transfers
              </th>
            </tr>
            <tr>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, RANK_CELL_CLASS_NAME)}
              >
                Rank
              </th>
              <th
                className={clsx(
                  HEADER_CELL_CLASS_NAME,
                  COLLECTOR_CELL_CLASS_NAME
                )}
              >
                <span>Collector</span>
                <span className={styles["totalResults"]}>
                  {props.isLoading && totalResults === 0
                    ? "..."
                    : `x${totalResults.toLocaleString()}`}
                </span>
              </th>
              {/* primary purchases */}
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Count&nbsp;
                  {printHeader(
                    LeaderboardInteractionsSort.primary_purchases_count
                  )}
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Value&nbsp;
                  {printHeader(
                    LeaderboardInteractionsSort.primary_purchases_value
                  )}
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, GAP_CELL_CLASS_NAME)}
              />
              {/* secondary purchases */}
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Count&nbsp;
                  {printHeader(
                    LeaderboardInteractionsSort.secondary_purchases_count
                  )}
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Value&nbsp;
                  {printHeader(
                    LeaderboardInteractionsSort.secondary_purchases_value
                  )}
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, GAP_CELL_CLASS_NAME)}
              />
              {/* sales */}
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Count&nbsp;
                  {printHeader(LeaderboardInteractionsSort.sales_count)}
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Value&nbsp;
                  {printHeader(LeaderboardInteractionsSort.sales_value)}
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, GAP_CELL_CLASS_NAME)}
              />
              {/* transfers */}
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Airdrops&nbsp;
                  {printHeader(LeaderboardInteractionsSort.airdrops)}
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  In&nbsp;
                  {printHeader(LeaderboardInteractionsSort.transfers_in)}
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Out&nbsp;
                  {printHeader(LeaderboardInteractionsSort.transfers_out)}
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Burns&nbsp;
                  {printHeader(LeaderboardInteractionsSort.burns)}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((lead: LeaderboardInteractions, index) => {
              return (
                <tr className={ROW_CLASS_NAME} key={lead.consolidation_key}>
                  <td
                    className={clsx(BODY_CELL_CLASS_NAME, RANK_CELL_CLASS_NAME)}
                  >
                    {numberWithCommas(
                      index + 1 + (page - 1) * LEADERBOARD_PAGE_SIZE
                    )}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      COLLECTOR_CELL_CLASS_NAME
                    )}
                  >
                    <LeaderboardCollector
                      handle={lead.handle}
                      consolidationKey={lead.consolidation_key}
                      consolidationDisplay={lead.consolidation_display}
                      pfp={lead.pfp_url}
                      level={lead.level}
                    />
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(lead.primary_purchases_count)}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(
                      Math.round(lead.primary_purchases_value * 100) / 100
                    )}
                  </td>
                  <td
                    className={clsx(BODY_CELL_CLASS_NAME, GAP_CELL_CLASS_NAME)}
                  />
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(lead.secondary_purchases_count)}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(
                      Math.round(lead.secondary_purchases_value * 100) / 100
                    )}
                  </td>
                  <td
                    className={clsx(BODY_CELL_CLASS_NAME, GAP_CELL_CLASS_NAME)}
                  />
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(lead.sales_count)}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(Math.round(lead.sales_value * 100) / 100)}
                  </td>
                  <td
                    className={clsx(BODY_CELL_CLASS_NAME, GAP_CELL_CLASS_NAME)}
                  />
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(lead.airdrops)}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(lead.transfers_in)}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(lead.transfers_out)}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(lead.burns)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </LeaderboardTableScrollShell>
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
