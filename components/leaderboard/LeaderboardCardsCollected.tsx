"use client";

import type { MemeSeason } from "@/entities/ISeason";
import { SortDirection } from "@/entities/ISort";
import { ApiConsolidatedTdhView } from "@/generated/models/ApiConsolidatedTdhView";
import { numberWithCommas } from "@/helpers/Helpers";
import clsx from "clsx";
import { useState } from "react";
import type { Collector, Content } from "./Leaderboard";
import styles from "./Leaderboard.module.scss";
import type { LeaderboardMetrics } from "./leaderboard_helpers";
import {
  formatPercentageFromCounts,
  LeaderboardCardsCollectedSort,
  useFetchLeaderboard,
} from "./leaderboard_helpers";
import { LeaderboardCollector } from "./LeaderboardCollector";
import LeaderboardFooter from "./LeaderboardDownload";
import LeaderboardSort from "./LeaderboardSort";

const PAGE_SIZE = 50;
const TABLE_CLASS_NAME = "tw-mb-0 tw-w-full tw-border-collapse tw-text-white";
const ROW_CLASS_NAME = "odd:tw-bg-[#1e1e1e] even:tw-bg-transparent";
const HEADER_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-p-2 tw-align-middle tw-font-semibold tw-leading-7 tw-text-white";
const BODY_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-p-2 tw-align-middle tw-leading-10 tw-text-white";
const HEADER_CONTENT_CLASS_NAME = "tw-flex tw-items-center tw-justify-center";
const RANK_CELL_CLASS_NAME = "tw-w-[4%] tw-text-center";
const COLLECTOR_CELL_CLASS_NAME = "tw-max-w-0 tw-w-[28%] tw-text-left";
const METRIC_CELL_CLASS_NAME = "tw-w-[9.7143%] tw-text-center";

function getLeaderboardRowKey(lead: LeaderboardMetrics) {
  return (
    lead.consolidation_key ??
    lead.primary_wallet ??
    lead.handle ??
    lead.consolidation_display ??
    [
      lead.level,
      lead.balance,
      lead.unique_memes,
      lead.memes_cards_sets,
      lead.tdh,
      lead.day_change,
    ].join("-")
  );
}

interface Props {
  block: number | undefined;
  content: Content;
  collector: Collector;
  selectedSeason: number;
  searchWallets: string[];
  tdhView: ApiConsolidatedTdhView;
  globalTdhRateChange?: number | undefined;
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
    sort: LeaderboardCardsCollectedSort.Level,
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
        tdhView: props.tdhView,
        useGeneratedFilterValues: true,
      },
      props.setIsLoading
    );

  function getTDHChange(lead: LeaderboardMetrics) {
    if (!lead.tdh) {
      return "";
    }

    const tdhChange = ((lead.day_change ?? 0) / lead.tdh) * 100;
    return ` (${tdhChange.toFixed(2)}%)`;
  }

  function calculateTdhVsCommunity(lead: LeaderboardMetrics) {
    if (!props.globalTdhRateChange || !lead.day_change || !lead.tdh) {
      return "-";
    }
    const tdhChange = (lead.day_change / lead.tdh) * 100;
    return `${Math.abs(tdhChange / props.globalTdhRateChange).toFixed(2)}x`;
  }

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

  return (
    <>
      <div className={styles["leaderboardTableShell"]}>
        <table className={TABLE_CLASS_NAME}>
          <thead>
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
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Level&nbsp;
                  <LeaderboardSort
                    sort_option={LeaderboardCardsCollectedSort.Level}
                    sort={sort}
                    setSort={setSort}
                  />
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Cards Collected&nbsp;
                  <LeaderboardSort
                    sort_option={LeaderboardCardsCollectedSort.Balance}
                    sort={sort}
                    setSort={setSort}
                  />
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Unique Memes&nbsp;
                  <LeaderboardSort
                    sort_option={LeaderboardCardsCollectedSort.UniqueMemes}
                    sort={sort}
                    setSort={setSort}
                  />
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Sets&nbsp;
                  <LeaderboardSort
                    sort_option={LeaderboardCardsCollectedSort.MemesCardsSets}
                    sort={sort}
                    setSort={setSort}
                  />
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  TDH&nbsp;
                  <LeaderboardSort
                    sort_option={LeaderboardCardsCollectedSort.Tdh}
                    sort={sort}
                    setSort={setSort}
                  />
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  Daily Change&nbsp;
                  <LeaderboardSort
                    sort_option={LeaderboardCardsCollectedSort.DayChange}
                    sort={sort}
                    setSort={setSort}
                  />
                </span>
              </th>
              <th
                className={clsx(HEADER_CELL_CLASS_NAME, METRIC_CELL_CLASS_NAME)}
              >
                <span className={HEADER_CONTENT_CLASS_NAME}>
                  vs Network&nbsp;
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((lead: LeaderboardMetrics, index) => {
              return (
                <tr className={ROW_CLASS_NAME} key={getLeaderboardRowKey(lead)}>
                  <td
                    className={clsx(BODY_CELL_CLASS_NAME, RANK_CELL_CLASS_NAME)}
                  >
                    {numberWithCommas(index + 1 + (page - 1) * PAGE_SIZE)}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      COLLECTOR_CELL_CLASS_NAME
                    )}
                  >
                    <LeaderboardCollector
                      handle={lead.handle ?? ""}
                      consolidationKey={lead.consolidation_key ?? ""}
                      consolidationDisplay={lead.consolidation_display ?? ""}
                      pfp={lead.pfp_url ?? ""}
                      level={lead.level ?? 0}
                    />
                  </td>

                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {lead.level ?? 0}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(lead.balance ?? 0)}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {lead.unique_memes
                      ? numberWithCommas(lead.unique_memes)
                      : 0}{" "}
                    / {numberWithCommas(lead.unique_memes_total ?? 0)} (
                    {formatPercentageFromCounts(
                      lead.unique_memes ?? 0,
                      lead.unique_memes_total ?? 0
                    )}
                    )
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(lead.memes_cards_sets ?? 0)}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {numberWithCommas(Math.round(lead.tdh ?? 0))}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {!lead.day_change ? (
                      "-"
                    ) : (
                      <>
                        {lead.day_change > 0 ? `+` : ``}
                        {numberWithCommas(lead.day_change)}
                        {lead.day_change != 0 && (
                          <span className={styles["tdhBoost"]}>
                            {getTDHChange(lead)}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td
                    className={clsx(
                      BODY_CELL_CLASS_NAME,
                      METRIC_CELL_CLASS_NAME
                    )}
                  >
                    {!lead.day_change
                      ? "-"
                      : `${calculateTdhVsCommunity(lead)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
