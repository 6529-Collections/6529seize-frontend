"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cicToType, numberWithCommas } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
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
  faDownload,
  faSpinner,
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
  locale?: SupportedLocale | undefined;
}

export const PAGE_SIZE = 25;
const EXPORT_PAGE_SIZE = 100;

const CSV_HEADERS = [
  "rank",
  "collector",
  "primary_wallet",
  "balance",
  "card_tdh",
  "card_unweighted_tdh",
  "total_balance",
  "total_tdh",
  "total_unweighted_tdh",
] as const;

interface FetchNftTdhResultsParams {
  readonly contract: string;
  readonly nftId: number;
  readonly walletFilter: string;
  readonly page: number;
  readonly pageSize?: number;
  readonly sort: string;
  readonly sortDirection: string;
  readonly signal?: AbortSignal;
}

type FetchAllNftTdhResultsParams = Omit<FetchNftTdhResultsParams, "page">;

function getNftTdhEndpoint({
  contract,
  nftId,
  walletFilter,
  page,
  pageSize,
  sort,
  sortDirection,
}: Readonly<
  Omit<FetchNftTdhResultsParams, "signal"> & { readonly pageSize: number }
>) {
  return `tdh/nft/${contract}/${nftId}?${walletFilter}&page_size=${pageSize}&page=${page}&sort=${sort}&sort_direction=${sortDirection}`;
}

function getWalletFilter(searchWallets: readonly string[]) {
  if (searchWallets.length === 0) {
    return "";
  }

  return `&search=${searchWallets.join(",")}`;
}

export async function fetchNftTdhResults({
  contract,
  nftId,
  walletFilter,
  page,
  pageSize = PAGE_SIZE,
  sort,
  sortDirection,
  signal,
}: Readonly<FetchNftTdhResultsParams>) {
  const endpoint = getNftTdhEndpoint({
    contract,
    nftId,
    walletFilter,
    page,
    pageSize,
    sort,
    sortDirection,
  });
  const results = await commonApiFetch<DBResponse<NftTDH>>({
    endpoint,
    ...(signal ? { signal } : {}),
  });
  results.data.forEach((lead: NftTDH) => {
    lead.cic_type = cicToType(lead.cic_score);
  });
  return results;
}

export async function fetchAllNftTdhResults({
  contract,
  nftId,
  walletFilter,
  sort,
  sortDirection,
  signal,
}: Readonly<FetchAllNftTdhResultsParams>) {
  const firstPage = await fetchNftTdhResults({
    contract,
    nftId,
    walletFilter,
    page: 1,
    pageSize: EXPORT_PAGE_SIZE,
    sort,
    sortDirection,
    ...(signal !== undefined ? { signal } : {}),
  });
  const totalPages = Math.ceil(firstPage.count / EXPORT_PAGE_SIZE);
  const allResults = [...firstPage.data];

  for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
    const response = await fetchNftTdhResults({
      contract,
      nftId,
      walletFilter,
      page: currentPage,
      pageSize: EXPORT_PAGE_SIZE,
      sort,
      sortDirection,
      ...(signal !== undefined ? { signal } : {}),
    });
    allResults.push(...response.data);
  }

  return allResults;
}

function getCollectorCsvName(collector: NftTDH) {
  const nameCandidates: ReadonlyArray<string | null | undefined> = [
    collector.handle,
    collector.consolidation_display,
    collector.consolidation_key,
  ];
  const populatedName = nameCandidates.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  );

  return populatedName ?? "";
}

function escapeCsvValue(value: number | string | null | undefined) {
  const rawValue = value === null || value === undefined ? "" : `${value}`;
  const stringValue = /^[=+\-@\t]/.test(rawValue) ? `'${rawValue}` : rawValue;

  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function buildNftCollectorsCsv(
  collectors: readonly NftTDH[],
  isSearchFiltered: boolean
) {
  const rows = collectors.map((collector, index) => {
    const rank = isSearchFiltered ? collector.tdh_rank : index + 1;

    return [
      rank,
      getCollectorCsvName(collector),
      collector.primary_wallet,
      collector.balance,
      collector.boosted_tdh,
      collector.tdh__raw,
      collector.total_balance,
      collector.total_boosted_tdh,
      collector.total_tdh__raw,
    ]
      .map(escapeCsvValue)
      .join(",");
  });

  return `${[CSV_HEADERS.join(","), ...rows].join("\n")}\n`;
}

function downloadNftCollectorsCsv(nftId: number, csv: string) {
  if (
    typeof document === "undefined" ||
    typeof globalThis.URL.createObjectURL !== "function"
  ) {
    throw new TypeError("CSV downloads are unavailable in this browser.");
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");

  try {
    link.href = url;
    link.download = `the-memes-${nftId}-collectors.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    globalThis.URL.revokeObjectURL(url);
  }
}

export function setScrollPosition() {
  const top = document.getElementById("nft-leaderboard")?.offsetTop;
  if (top !== undefined && top > 0 && window.scrollY > 0) {
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

type CsvDownloadStatus = "idle" | "downloading" | "success" | "error";

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

export function NftLeaderboardCollectorRow({
  children,
  lead,
}: Readonly<{
  children?: ReactNode;
  lead: NftTDHRanked;
}>) {
  return (
    <tr className="odd:tw-bg-transparent even:tw-bg-iron-900/45 hover:tw-bg-iron-900/70">
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
      {children}
    </tr>
  );
}

function getCsvStatusMessage(
  status: CsvDownloadStatus,
  locale: SupportedLocale
) {
  if (status === "downloading") {
    return t(locale, "theMemes.detail.collectors.downloadCsvStatusPreparing");
  }

  if (status === "success") {
    return t(locale, "theMemes.detail.collectors.downloadCsvStatusReady");
  }

  return "";
}

interface LeaderboardViewState {
  page: number;
  sort: {
    sort: Sort;
    sort_direction: SortDirection;
  };
  showSearchModal: boolean;
  searchWallets: string[];
}

function CollectorsCsvDownloadControls({
  children,
  contract,
  nftId,
  locale,
  searchWallets,
  sort,
  sortDirection,
}: Readonly<{
  children: ReactNode;
  contract: string;
  nftId: number;
  locale: SupportedLocale;
  searchWallets: readonly string[];
  sort: Sort;
  sortDirection: SortDirection;
}>) {
  const csvAbortControllerRef = useRef<AbortController | null>(null);
  const [csvDownloadState, setCsvDownloadState] = useState<
    Readonly<{
      status: CsvDownloadStatus;
      requestKey: string | null;
    }>
  >({ status: "idle", requestKey: null });
  const csvRequestKey = `${contract}:${nftId}:${searchWallets.join(",")}:${sort}:${sortDirection}`;
  const csvStatus =
    csvDownloadState.requestKey === csvRequestKey
      ? csvDownloadState.status
      : "idle";
  const csvStatusMessage = getCsvStatusMessage(csvStatus, locale);

  useEffect(() => {
    csvAbortControllerRef.current?.abort();
    csvAbortControllerRef.current = null;
  }, [csvRequestKey]);

  useEffect(() => {
    return () => {
      csvAbortControllerRef.current?.abort();
    };
  }, []);

  const handleCsvDownload = useCallback(() => {
    if (csvStatus === "downloading") {
      return;
    }

    const abortController = new AbortController();
    csvAbortControllerRef.current?.abort();
    csvAbortControllerRef.current = abortController;
    setCsvDownloadState({
      status: "downloading",
      requestKey: csvRequestKey,
    });

    void (async () => {
      try {
        const collectors = await fetchAllNftTdhResults({
          contract,
          nftId,
          walletFilter: getWalletFilter(searchWallets),
          sort,
          sortDirection,
          signal: abortController.signal,
        });
        const csv = buildNftCollectorsCsv(collectors, searchWallets.length > 0);
        downloadNftCollectorsCsv(nftId, csv);
        if (!abortController.signal.aborted) {
          setCsvDownloadState({
            status: "success",
            requestKey: csvRequestKey,
          });
        }
      } catch {
        if (!abortController.signal.aborted) {
          setCsvDownloadState({
            status: "error",
            requestKey: csvRequestKey,
          });
        }
      } finally {
        if (csvAbortControllerRef.current === abortController) {
          csvAbortControllerRef.current = null;
        }
      }
    })();
  }, [
    contract,
    csvRequestKey,
    csvStatus,
    nftId,
    searchWallets,
    sort,
    sortDirection,
  ]);

  const isCsvDownloading = csvStatus === "downloading";

  return (
    <div className="tw-flex tw-flex-col tw-items-end tw-gap-2">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-3">
        <button
          type="button"
          onClick={handleCsvDownload}
          disabled={isCsvDownloading}
          aria-busy={isCsvDownloading}
          aria-label={t(
            locale,
            "theMemes.detail.collectors.downloadCsvAriaLabel"
          )}
          className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-200 tw-transition-colors tw-duration-300 tw-ease-out hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
        >
          <span className="tw-whitespace-nowrap">
            {isCsvDownloading
              ? t(locale, "theMemes.detail.collectors.downloadingCsv")
              : t(locale, "theMemes.detail.collectors.downloadCsv")}
          </span>
          <FontAwesomeIcon
            icon={isCsvDownloading ? faSpinner : faDownload}
            className={`tw-size-3.5 ${isCsvDownloading ? "motion-safe:tw-animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
        {children}
      </div>
      <span className="tw-sr-only" role="status" aria-live="polite">
        {csvStatusMessage}
      </span>
      {csvStatus === "error" && (
        <p
          className="tw-mb-0 tw-mt-0 tw-text-right tw-text-sm tw-font-medium tw-text-error"
          role="alert"
        >
          {t(locale, "theMemes.detail.collectors.downloadCsvError")}
        </p>
      )}
    </div>
  );
}

export default function NFTLeaderboard(props: Readonly<Props>) {
  const locale = props.locale ?? DEFAULT_LOCALE;
  const leaderboardSectionRef = useRef<HTMLElement | null>(null);
  const [viewState, setViewState] = useState<LeaderboardViewState>({
    page: 1,
    sort: { sort: Sort.balance, sort_direction: SortDirection.DESC },
    showSearchModal: false,
    searchWallets: [],
  });
  const { page, searchWallets, showSearchModal, sort } = viewState;

  const setPage = useCallback((newPage: number) => {
    setViewState((current) => ({ ...current, page: newPage }));
  }, []);

  const setSearchWallets = useCallback((wallets: string[]) => {
    setViewState((current) => ({
      ...current,
      page: 1,
      searchWallets: wallets,
    }));
  }, []);

  const setShowSearchModal = useCallback((show: boolean) => {
    setViewState((current) => ({ ...current, showSearchModal: show }));
  }, []);

  const setSort = useCallback((nextSort: LeaderboardViewState["sort"]) => {
    setViewState((current) => ({ ...current, page: 1, sort: nextSort }));
  }, []);

  const leaderboardQueryParams = useMemo(
    () => ({
      contract: props.contract,
      nftId: props.nftId,
      walletFilter: getWalletFilter(searchWallets),
      page,
      sort: sort.sort,
      sortDirection: sort.sort_direction,
    }),
    [
      page,
      props.contract,
      props.nftId,
      searchWallets,
      sort.sort,
      sort.sort_direction,
    ]
  );

  const leaderboardQuery = useQuery({
    queryKey: [QueryKey.NFTS, "tdh", leaderboardQueryParams],
    queryFn: async ({ signal }) =>
      await fetchNftTdhResults({ ...leaderboardQueryParams, signal }),
    placeholderData: keepPreviousData,
  });

  const leaderboard = useMemo<NftTDHRanked[]>(() => {
    const responsePage = leaderboardQuery.data?.page ?? page;
    return (leaderboardQuery.data?.data ?? []).map((lead, index) => {
      const rank =
        searchWallets.length > 0
          ? lead.tdh_rank
          : index + 1 + (responsePage - 1) * PAGE_SIZE;
      return { ...lead, rank };
    });
  }, [leaderboardQuery.data, page, searchWallets.length]);

  const totalResults = leaderboardQuery.data?.count ?? 0;
  const fetchingLeaderboard = leaderboardQuery.isFetching;

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

  const handleLeaderboardPageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      leaderboardSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [setPage]
  );

  return (
    <section
      ref={leaderboardSectionRef}
      className="tw-scroll-mt-24 tw-pt-8"
      id="nft-leaderboard"
    >
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(locale, "theMemes.detail.collectors.leaderboardTitle")}
        </h3>
        <CollectorsCsvDownloadControls
          contract={props.contract}
          nftId={props.nftId}
          locale={locale}
          searchWallets={searchWallets}
          sort={sort.sort}
          sortDirection={sort.sort_direction}
        >
          <SearchWalletsDisplay
            searchWallets={searchWallets}
            setSearchWallets={setSearchWallets}
            setShowSearchModal={setShowSearchModal}
          />
        </CollectorsCsvDownloadControls>
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
                {totalResults > 0 && `x${formatInteger(locale, totalResults)}`}
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
                <NftLeaderboardCollectorRow
                  key={lead.consolidation_key}
                  lead={lead}
                >
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
                </NftLeaderboardCollectorRow>
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
