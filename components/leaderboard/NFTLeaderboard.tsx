"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cicToType, numberWithCommas } from "@/helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "@/entities/ISort";
import type { CICType } from "@/entities/IProfile";
import type { DBResponse } from "@/entities/IDBResponse";
import { LeaderboardCollector } from "./LeaderboardCollector";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "../searchModal/SearchModal";
import { commonApiFetch } from "@/services/api/common-api";
import {
  faSquareCaretUp,
  faSquareCaretDown,
} from "@fortawesome/free-solid-svg-icons";

const tableHeaderClassName =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-center tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-400 md:tw-px-4 md:tw-py-3";

const tableCellClassName =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-center tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-100 md:tw-px-4 md:tw-py-3 md:tw-text-sm";

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
  const results = await commonApiFetch<DBResponse<NftTDH>>({
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
  cic_type?: CICType | undefined;
}

export interface NftTDHRanked extends NftTDH {
  rank: number;
}

export default function NFTLeaderboard(props: Readonly<Props>) {
  const leaderboardSectionRef = useRef<HTMLElement | null>(null);
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

  function getCaretClassName(sortOption: Sort, sortDirection: SortDirection) {
    const active =
      sort.sort === sortOption && sort.sort_direction === sortDirection;
    return `tw-h-3 tw-w-3 tw-transition-colors ${
      active ? "tw-text-white" : "tw-text-iron-500 hover:tw-text-white"
    }`;
  }

  function printSortControls(sortOption: Sort, label: string) {
    return (
      <span className="tw-flex tw-flex-col tw-items-center">
        <button
          type="button"
          onClick={() =>
            setSort({
              sort: sortOption,
              sort_direction: SortDirection.ASC,
            })
          }
          className="tw-m-0 tw-flex tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0"
          aria-label={`Sort ${label} ascending`}
        >
          <FontAwesomeIcon
            icon={faSquareCaretUp}
            className={getCaretClassName(sortOption, SortDirection.ASC)}
          />
        </button>
        <button
          type="button"
          onClick={() =>
            setSort({
              sort: sortOption,
              sort_direction: SortDirection.DESC,
            })
          }
          className="tw-m-0 tw-flex tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0"
          aria-label={`Sort ${label} descending`}
        >
          <FontAwesomeIcon
            icon={faSquareCaretDown}
            className={getCaretClassName(sortOption, SortDirection.DESC)}
          />
        </button>
      </span>
    );
  }

  function printSortableHeader(
    label: string,
    sortOption: Sort,
    className = ""
  ) {
    return (
      <th scope="col" className={`${tableHeaderClassName} ${className}`}>
        <span className="tw-flex tw-items-center tw-justify-center tw-gap-1.5">
          {label}
          {printSortControls(sortOption, label)}
        </span>
      </th>
    );
  }

  const handleLeaderboardPageChange = useCallback((newPage: number) => {
    setPage(newPage);
    leaderboardSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return (
    <section
      ref={leaderboardSectionRef}
      className="tw-scroll-mt-24 tw-pt-8"
      id="nft-leaderboard"
    >
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          Collectors leaderboard
        </h3>
        <SearchWalletsDisplay
          searchWallets={searchWallets}
          setSearchWallets={setSearchWallets}
          setShowSearchModal={setShowSearchModal}
        />
      </div>
      <div className="tw-overflow-x-auto">
        <table className="tw-w-full tw-min-w-[23rem] tw-border-collapse md:tw-min-w-[1040px]">
          <thead>
            <tr>
              <th
                colSpan={2}
                aria-hidden="true"
                className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3"
              />
              <th
                colSpan={3}
                scope="colgroup"
                className="tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-l tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-center tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-300"
              >
                This Card
              </th>
              <th
                colSpan={3}
                scope="colgroup"
                className="tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-l tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-center tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-300"
              >
                Total
              </th>
            </tr>
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
              {printSortableHeader("Balance", Sort.balance, "tw-border-l")}
              {printSortableHeader("TDH", Sort.boosted_tdh)}
              {printSortableHeader("Unweighted TDH", Sort.tdh__raw)}
              {printSortableHeader(
                "Balance",
                Sort.total_balance,
                "tw-border-l"
              )}
              {printSortableHeader("TDH", Sort.total_boosted_tdh)}
              {printSortableHeader("Unweighted TDH", Sort.total_tdh__raw)}
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
                  <td className={tableCellClassName}>
                    {numberWithCommas(Math.round(lead.boosted_tdh))}
                  </td>
                  <td className={tableCellClassName}>
                    {numberWithCommas(Math.round(lead.tdh__raw))}
                  </td>
                  <td className={`${tableCellClassName} tw-border-l`}>
                    {numberWithCommas(lead.total_balance)}
                  </td>
                  <td className={tableCellClassName}>
                    {numberWithCommas(Math.round(lead.total_boosted_tdh))}
                  </td>
                  <td className={tableCellClassName}>
                    {numberWithCommas(Math.round(lead.total_tdh__raw))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {leaderboard.length === 0 && !fetchingLeaderboard && (
        <div className="tw-py-5 tw-text-sm tw-font-medium tw-text-iron-400">
          No Results found
        </div>
      )}
      {totalResults > 0 && (
        <div className="tw-flex tw-justify-center tw-pb-3 tw-pt-4">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={handleLeaderboardPageChange}
          />
        </div>
      )}
      <SearchModalDisplay
        show={showSearchModal}
        setShow={setShowSearchModal}
        searchWallets={searchWallets}
        setSearchWallets={setSearchWallets}
      />
    </section>
  );
}
