"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
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
import Button from "@/components/utils/button/Button";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { DATA_TABLE_HEADER_TEXT_CLASS_NAME } from "@/components/utils/table/tableStyles";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "@/entities/ISort";
import type { CICType } from "@/entities/IProfile";
import type { DBResponse } from "@/entities/IDBResponse";
import { LeaderboardCollector } from "./LeaderboardCollector";
import { LEADERBOARD_ROW_CLASS_NAME } from "./leaderboardTableStyles";
import {
  NFTLeaderboardMobileRows,
  NFTLeaderboardMobileSort,
} from "./NFTLeaderboardMobile";
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

import {
  buildNftCollectorsCsv,
  downloadNftCollectorsCsv,
} from "./nftCollectorsCsv";

export { buildNftCollectorsCsv } from "./nftCollectorsCsv";

const tableHeaderClassName = `tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-center tw-font-semibold tw-text-iron-400 md:tw-px-4 md:tw-py-3 ${DATA_TABLE_HEADER_TEXT_CLASS_NAME}`;

const tableCellClassName =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-center tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-100 md:tw-px-4 md:tw-py-3 md:tw-text-sm";

interface Props {
  contract: string;
  nftId: number;
  locale?: SupportedLocale | undefined;
}

export const PAGE_SIZE = 25;
const EXPORT_PAGE_SIZE = 100;

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

export function setScrollPosition() {
  const top = document.getElementById("nft-leaderboard")?.offsetTop;
  if (top !== undefined && top > 0 && window.scrollY > 0) {
    window.scrollTo({
      top: top,
      behavior: "smooth",
    });
  }
}

export enum Sort {
  balance = "balance",
  tdh__raw = "tdh__raw",
  boosted_tdh = "boosted_tdh",
  total_balance = "total_balance",
  total_tdh__raw = "total_tdh__raw",
  total_boosted_tdh = "total_boosted_tdh",
}

type CsvDownloadStatus = "idle" | "downloading" | "success" | "error";

export interface NftTDH {
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
    <tr className={LEADERBOARD_ROW_CLASS_NAME}>
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
  const csvTooltipId = useId();
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
  const csvButtonLabel = t(
    locale,
    isCsvDownloading
      ? "theMemes.detail.collectors.downloadingCsv"
      : "theMemes.detail.collectors.downloadCsv"
  );

  return (
    <div className="tw-flex tw-flex-col tw-items-end tw-gap-2 max-md:tw-contents max-md:[&>div>button]:tw-size-9 max-md:[&>div>button]:tw-shrink-0 max-md:[&>div>button]:tw-rounded-lg max-md:[&>div>button]:tw-border-iron-800 max-md:[&>div>button]:tw-bg-iron-950 max-md:[&>div>button]:tw-p-0 max-md:[&>div>button]:tw-text-iron-300 max-md:[&>div]:tw-contents max-md:[&>p]:tw-order-2 max-md:[&>p]:tw-w-full">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-3">
        <Button
          type="button"
          onClick={handleCsvDownload}
          disabled={isCsvDownloading}
          aria-busy={isCsvDownloading}
          data-tooltip-id={csvTooltipId}
          variant="secondary"
          size="sm"
          aria-label={t(
            locale,
            "theMemes.detail.collectors.downloadCsvAriaLabel"
          )}
        >
          <span className="tw-hidden tw-whitespace-nowrap md:tw-inline">
            {csvButtonLabel}
          </span>
          <FontAwesomeIcon
            icon={isCsvDownloading ? faSpinner : faDownload}
            className={`tw-size-3.5 ${isCsvDownloading ? "motion-safe:tw-animate-spin" : ""}`}
            aria-hidden="true"
          />
        </Button>
        {children}
      </div>
      <BodyPortalTooltip
        id={csvTooltipId}
        content={csvButtonLabel}
        place="top"
        className="md:!tw-hidden [&.react-tooltip\_\_closing]:tw-invisible"
        style={TOOLTIP_STYLES}
        globalCloseEvents={{ escape: true, scroll: true, resize: true }}
      />
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
          aria-label={t(locale, "theMemes.detail.collectors.sortAscending", {
            label,
          })}
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
          aria-label={t(locale, "theMemes.detail.collectors.sortDescending", {
            label,
          })}
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
      <div className="tw-mb-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 max-md:tw-gap-x-2 max-md:tw-gap-y-1 md:tw-mb-4">
        <h3 className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-[17px] tw-font-semibold tw-leading-[22px] tw-text-iron-50 md:tw-flex-none md:tw-text-lg md:tw-leading-7 md:tw-text-iron-100">
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
          <div className="tw-contents [&>span>button:last-of-type]:tw-rounded-lg max-md:[&>span>button:last-of-type]:tw-size-9 max-md:[&>span>button:last-of-type]:tw-shrink-0 max-md:[&>span>button:last-of-type]:tw-border-iron-800 max-md:[&>span>button:last-of-type]:tw-bg-iron-950 max-md:[&>span>button:last-of-type]:tw-p-0 max-md:[&>span>button:last-of-type]:tw-text-iron-300 max-md:[&>span>button:last-of-type_svg]:tw-size-3.5 max-md:[&>span>button:not(:last-of-type)]:tw-order-1 max-md:[&>span>button:not(:last-of-type)]:tw-min-w-0 max-md:[&>span>button:not(:last-of-type)]:tw-max-w-full max-md:[&>span>span>span]:tw-truncate max-md:[&>span>span]:tw-order-1 max-md:[&>span>span]:tw-min-w-0 max-md:[&>span>span]:tw-max-w-full max-md:[&>span]:tw-contents">
            <SearchWalletsDisplay
              searchWallets={searchWallets}
              setSearchWallets={setSearchWallets}
              setShowSearchModal={setShowSearchModal}
            />
          </div>
        </CollectorsCsvDownloadControls>
      </div>
      <NFTLeaderboardMobileSort
        locale={locale}
        sort={sort.sort}
        direction={sort.sort_direction}
        options={[
          {
            value: Sort.balance,
            label: t(locale, "theMemes.detail.collectors.balance"),
          },
          {
            value: Sort.boosted_tdh,
            label: t(locale, "theMemes.detail.collectors.tdh"),
          },
          {
            value: Sort.tdh__raw,
            label: t(locale, "theMemes.detail.collectors.unweightedTdh"),
          },
          {
            value: Sort.total_balance,
            label: t(locale, "theMemes.detail.collectors.totalBalance"),
          },
          {
            value: Sort.total_boosted_tdh,
            label: t(locale, "theMemes.detail.collectors.totalTdh"),
          },
          {
            value: Sort.total_tdh__raw,
            label: t(locale, "theMemes.detail.collectors.totalUnweightedTdh"),
          },
        ]}
        onSort={(value) => setSort({ ...sort, sort: value })}
        onDirection={(value) => setSort({ ...sort, sort_direction: value })}
      />
      <NFTLeaderboardMobileRows
        locale={locale}
        leaderboard={leaderboard}
        sort={sort.sort}
      />
      <div className="tw-hidden tw-overflow-x-auto md:tw-block">
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
                className={`tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-l tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-center tw-font-semibold tw-text-iron-300 ${DATA_TABLE_HEADER_TEXT_CLASS_NAME}`}
              >
                {t(locale, "theMemes.detail.collectors.thisCard")}
              </th>
              <th
                colSpan={3}
                scope="colgroup"
                className={`tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-l tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-center tw-font-semibold tw-text-iron-300 ${DATA_TABLE_HEADER_TEXT_CLASS_NAME}`}
              >
                {t(locale, "theMemes.detail.collectors.total")}
              </th>
            </tr>
            <tr>
              <th
                scope="col"
                className={`tw-w-12 tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-center tw-font-semibold tw-text-iron-400 md:tw-w-20 md:tw-px-4 md:tw-py-3 ${DATA_TABLE_HEADER_TEXT_CLASS_NAME}`}
              >
                {t(locale, "theMemes.detail.collectors.rank")}
              </th>
              <th
                scope="col"
                className={`tw-min-w-[11rem] tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-left tw-font-semibold tw-text-iron-400 md:tw-min-w-[18rem] md:tw-px-4 md:tw-py-3 ${DATA_TABLE_HEADER_TEXT_CLASS_NAME}`}
              >
                {totalResults > 0
                  ? t(locale, "theMemes.detail.collectors.collectorCount", {
                      count: formatInteger(locale, totalResults),
                    })
                  : t(locale, "theMemes.detail.collectors.collector")}
              </th>
              {printSortableHeader(
                t(locale, "theMemes.detail.collectors.balance"),
                Sort.balance,
                "tw-border-l"
              )}
              {printSortableHeader(
                t(locale, "theMemes.detail.collectors.tdh"),
                Sort.boosted_tdh
              )}
              {printSortableHeader(
                t(locale, "theMemes.detail.collectors.unweightedTdh"),
                Sort.tdh__raw
              )}
              {printSortableHeader(
                t(locale, "theMemes.detail.collectors.balance"),
                Sort.total_balance,
                "tw-border-l"
              )}
              {printSortableHeader(
                t(locale, "theMemes.detail.collectors.tdh"),
                Sort.total_boosted_tdh
              )}
              {printSortableHeader(
                t(locale, "theMemes.detail.collectors.unweightedTdh"),
                Sort.total_tdh__raw
              )}
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
          {t(locale, "theMemes.detail.collectors.noResults")}
        </div>
      )}
      {totalResults > 0 && (
        <div className="tw-flex tw-justify-center tw-pb-3 tw-pt-4 max-md:[&>span>button:first-child]:tw-size-9 max-md:[&>span>button:first-child]:tw-rounded-lg max-md:[&>span>button:first-child]:tw-border max-md:[&>span>button:first-child]:tw-border-solid max-md:[&>span>button:first-child]:tw-border-iron-800 max-md:[&>span>button:first-child]:tw-bg-iron-950 max-md:[&>span>button:first-child]:tw-text-iron-200 max-md:[&>span>button:last-child]:tw-size-9 max-md:[&>span>button:last-child]:tw-rounded-lg max-md:[&>span>button:last-child]:tw-border max-md:[&>span>button:last-child]:tw-border-solid max-md:[&>span>button:last-child]:tw-border-iron-800 max-md:[&>span>button:last-child]:tw-bg-iron-950 max-md:[&>span>button:last-child]:tw-text-iron-200 max-md:[&>span>button]:tw-text-sm max-md:[&>span>span]:tw-text-sm max-md:[&>span]:tw-gap-2 max-md:[&>span]:tw-text-sm max-md:[&>span]:tw-text-iron-400 max-md:[&_input]:tw-h-9 max-md:[&_input]:tw-w-12 max-md:[&_input]:tw-rounded-lg max-md:[&_input]:tw-border max-md:[&_input]:tw-border-solid max-md:[&_input]:tw-border-iron-800 max-md:[&_input]:tw-bg-iron-950 max-md:[&_input]:tw-text-center max-md:[&_input]:tw-text-sm max-md:[&_input]:tw-text-iron-100 max-md:[&_svg]:tw-w-3.5">
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
