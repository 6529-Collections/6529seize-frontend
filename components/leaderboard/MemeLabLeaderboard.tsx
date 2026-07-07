"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { numberWithCommas } from "@/helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "@/entities/ISort";
import { LeaderboardCollector } from "./LeaderboardCollector";
import type { NftTDHRanked } from "./NFTLeaderboard";
import { fetchNftTdhResults, PAGE_SIZE } from "./NFTLeaderboard";
import {
  faSquareCaretUp,
  faSquareCaretDown,
} from "@fortawesome/free-solid-svg-icons";

const tableHeaderClassName =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-center tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-400 md:tw-px-4 md:tw-py-3";

const tableCellClassName =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-center tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-100 md:tw-px-4 md:tw-py-3 md:tw-text-sm";

const MEME_LAB_BALANCE_SORT = "balance";

interface Props {
  contract: string;
  nftId: number;
}

type LeaderboardRequest = {
  readonly page: number;
  readonly sortDirection: SortDirection;
};

type MemeLabLeaderboardData = {
  readonly count: number;
  readonly data: NftTDHRanked[];
};

export default function MemeLabLeaderboard(props: Readonly<Props>) {
  const [request, setRequest] = useState<LeaderboardRequest>({
    page: 1,
    sortDirection: SortDirection.DESC,
  });
  const { data: leaderboardData, isFetched } = useQuery({
    queryKey: [
      "meme-lab-leaderboard",
      props.contract,
      props.nftId,
      request.page,
      MEME_LAB_BALANCE_SORT,
      request.sortDirection,
    ],
    queryFn: async ({ signal }): Promise<MemeLabLeaderboardData> => {
      const response = await fetchNftTdhResults({
        contract: props.contract,
        nftId: props.nftId,
        walletFilter: "",
        page: request.page,
        sort: MEME_LAB_BALANCE_SORT,
        sortDirection: request.sortDirection,
        signal,
      });
      const data: NftTDHRanked[] = response.data.map((lead, index) => {
        const rank = index + 1 + (request.page - 1) * PAGE_SIZE;
        return { ...lead, rank };
      });
      return { count: response.count, data };
    },
    placeholderData: keepPreviousData,
  });
  const totalResults = leaderboardData?.count ?? 0;
  const leaderboard = leaderboardData?.data ?? [];

  function handleSortChange(sortDirection: SortDirection) {
    setRequest({
      page: 1,
      sortDirection,
    });
  }

  function handlePageChange(newPage: number) {
    setRequest((current) => ({ ...current, page: newPage }));
  }

  function getCaretClassName(sortDirection: SortDirection) {
    const active = request.sortDirection === sortDirection;
    return `tw-h-3 tw-w-3 tw-transition-colors ${
      active ? "tw-text-white" : "tw-text-iron-500 hover:tw-text-white"
    }`;
  }

  function printSortControls(label: string) {
    return (
      <span className="tw-flex tw-flex-col tw-items-center">
        <button
          type="button"
          onClick={() => handleSortChange(SortDirection.ASC)}
          className="tw-m-0 tw-flex tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0"
          aria-label={`Sort ${label} ascending`}
        >
          <FontAwesomeIcon
            icon={faSquareCaretUp}
            className={getCaretClassName(SortDirection.ASC)}
          />
        </button>
        <button
          type="button"
          onClick={() => handleSortChange(SortDirection.DESC)}
          className="tw-m-0 tw-flex tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0"
          aria-label={`Sort ${label} descending`}
        >
          <FontAwesomeIcon
            icon={faSquareCaretDown}
            className={getCaretClassName(SortDirection.DESC)}
          />
        </button>
      </span>
    );
  }

  return (
    <section className="tw-scroll-mt-24 tw-pt-8" id="nft-leaderboard">
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          Collectors leaderboard
        </h3>
      </div>
      <div className="tw-overflow-x-auto">
        <table className="tw-w-full tw-min-w-[28rem] tw-border-collapse md:tw-min-w-[640px]">
          <thead>
            <tr>
              <th
                scope="col"
                className="tw-w-12 tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-center tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-400 md:tw-w-20 md:tw-px-4 md:tw-py-3"
              >
                Rank
              </th>
              <th
                scope="col"
                className="tw-min-w-[11rem] tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-400 md:tw-min-w-[18rem] md:tw-px-4 md:tw-py-3"
              >
                Collector{" "}
                {totalResults > 0 && `x${totalResults.toLocaleString()}`}
              </th>
              <th scope="col" className={`${tableHeaderClassName} tw-border-l`}>
                <span className="tw-flex tw-items-center tw-justify-center tw-gap-1.5">
                  Balance
                  {printSortControls("Balance")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((lead) => {
              return (
                <tr
                  key={lead.consolidation_key}
                  className="odd:tw-bg-transparent even:tw-bg-iron-900/45 hover:tw-bg-iron-900/70"
                >
                  <td className="tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-center tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-100 md:tw-px-4 md:tw-py-3 md:tw-text-sm">
                    {numberWithCommas(lead.rank)}
                  </td>
                  <td className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 md:tw-px-4 md:tw-py-3">
                    <LeaderboardCollector
                      handle={lead.handle}
                      consolidationKey={lead.consolidation_key}
                      consolidationDisplay={lead.consolidation_display}
                      pfp={lead.pfp_url}
                      level={lead.level}
                    />
                  </td>
                  <td className={`${tableCellClassName} tw-border-l`}>
                    {numberWithCommas(lead.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalResults > 0 && (
        <div className="tw-flex tw-justify-center tw-pb-3 tw-pt-4">
          <Pagination
            page={request.page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={handlePageChange}
          />
        </div>
      )}
      {isFetched && leaderboard.length === 0 && (
        <div className="tw-py-5 tw-text-sm tw-font-medium tw-text-iron-400">
          No Results found
        </div>
      )}
    </section>
  );
}
