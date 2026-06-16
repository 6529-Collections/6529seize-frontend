"use client";

import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import RememeImage from "@/components/nft-image/RememeImage";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import Pagination from "@/components/pagination/Pagination";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { publicEnv } from "@/config/env";
import { useSetTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFTLite, Rememe } from "@/entities/INFT";
import { formatAddress } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
import { ArrowPathIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { getRememeSortLabel, getRememeTokenTypeLabel } from "./rememesI18n";
import {
  getRememesAddHref,
  getRememeDetailHref,
  getRememesBrowseQuery,
  type RememesSearchParams,
} from "./rememesRouteParams";
import { RememeSort, TokenType } from "./rememesTypes";

const PAGE_SIZE = 40;

export { RememeSort, TokenType } from "./rememesTypes";

const REMEMES_GRID_CLASS =
  "tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-3 tw-p-0 tw-pt-2 sm:tw-grid-cols-3 sm:tw-gap-4 lg:tw-grid-cols-4 xl:tw-gap-5";
const REMEMES_TOTAL_COUNT_CLASS =
  "tw-shrink-0 tw-text-sm tw-font-medium tw-leading-none tw-text-iron-500 sm:tw-text-base";
const REMEME_SORTING = [RememeSort.RANDOM, RememeSort.CREATED_ASC] as const;
const TOKEN_TYPES = [
  TokenType.ALL,
  TokenType.ERC721,
  TokenType.ERC1155,
] as const;
const ADD_REMEME_LINK_CLASS =
  "tw-flex tw-items-center tw-whitespace-nowrap tw-rounded-lg tw-bg-iron-200 tw-text-sm tw-font-semibold tw-px-3.5 tw-py-2.5 tw-justify-center tw-gap-x-1.5 tw-border-0 tw-text-iron-950 tw-ring-1 tw-ring-inset tw-ring-white tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-300 hover:tw-ring-iron-300 focus:tw-z-10 focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

function getRememeCollectionName(rememe: Rememe) {
  return (
    rememe.contract_opensea_data?.collectionName?.trim() ||
    formatAddress(rememe.contract)
  );
}

function getRememeTitle(rememe: Rememe) {
  const metadataName =
    typeof rememe.metadata?.name === "string"
      ? rememe.metadata.name.trim()
      : "";

  return metadataName || getRememeCollectionName(rememe);
}

export default function Rememes({
  initialMemeId = 0,
  locale = DEFAULT_LOCALE,
  searchParams,
}: {
  readonly initialMemeId?: number | undefined;
  readonly locale?: SupportedLocale | undefined;
  readonly searchParams?: RememesSearchParams | undefined;
}) {
  useSetTitle(t(locale, "rememes.documentTitle"));
  const router = useRouter();
  const pathname = usePathname();

  const [memes, setMemes] = useState<NFTLite[]>([]);

  const [rememes, setRememes] = useState<Rememe[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [rememesLoaded, setRememesLoaded] = useState(false);

  const [selectedTokenType, setSelectedTokenType] = useState<TokenType>(
    TokenType.ALL
  );

  const [selectedMeme, setSelectedMeme] = useState<number>(() => initialMemeId);

  useEffect(() => {
    setSelectedMeme(initialMemeId);
  }, [initialMemeId]);

  const [selectedSorting, setSelectedSorting] = useState<RememeSort>(
    RememeSort.RANDOM
  );
  const sortingItems: CommonSelectItem<RememeSort>[] = REMEME_SORTING.map(
    (sort) => ({
      label: getRememeSortLabel(sort, locale),
      value: sort,
      key: `sorting-${sort}`,
    })
  );
  const tokenTypeItems: CommonSelectItem<TokenType>[] = TOKEN_TYPES.map(
    (tokenType) => ({
      label: getRememeTokenTypeLabel(tokenType, locale),
      value: tokenType,
      key: `token-type-${tokenType}`,
    })
  );
  const memeReferenceItems: CommonSelectItem<number>[] = [
    {
      label: t(locale, "rememes.memeReference.all"),
      value: 0,
      key: "meme-all",
    },
    ...memes.map((meme) => ({
      label: `#${meme.id} - ${meme.name}`,
      value: meme.id,
      key: `meme-${meme.id}`,
    })),
  ];
  const activeFetchRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchUrl(`${publicEnv.API_ENDPOINT}/api/memes_lite`)
      .then((response: DBResponse) => {
        setMemes(response.data);
      })
      .catch((error) => {
        console.error("Error fetching memes", error);
      });
  }, []);

  const fetchResults = useCallback(
    (mypage: number) => {
      setRememesLoaded(false);
      activeFetchRequest.current?.abort();
      const abortController = new AbortController();
      activeFetchRequest.current = abortController;
      let memeFilter = "";
      if (selectedMeme) {
        memeFilter = `&meme_id=${selectedMeme}`;
      }
      let tokenTypeFilter = "";
      if (selectedTokenType !== TokenType.ALL) {
        tokenTypeFilter = `&token_type=${selectedTokenType.replaceAll("-", "")}`;
      }
      let sort = "";
      if (selectedSorting === RememeSort.CREATED_ASC) {
        sort = "&sort=created_at&sort_direction=desc";
      }
      let url = `${publicEnv.API_ENDPOINT}/api/rememes?page_size=${PAGE_SIZE}&page=${mypage}${memeFilter}${tokenTypeFilter}${sort}`;
      fetchUrl(url, { signal: abortController.signal })
        .then((response: DBResponse) => {
          if (
            abortController.signal.aborted ||
            activeFetchRequest.current !== abortController
          ) {
            return;
          }
          setTotalResults(response.count);
          setRememes(response.data);
        })
        .catch((err) => {
          if (abortController.signal.aborted) {
            return;
          }
          console.error("Error fetching rememes", err);
        })
        .finally(() => {
          if (activeFetchRequest.current === abortController) {
            activeFetchRequest.current = null;
            setRememesLoaded(true);
          }
        });
    },
    [selectedMeme, selectedSorting, selectedTokenType]
  );
  const previousFilters = useRef({
    selectedMeme,
    selectedSorting,
    selectedTokenType,
  });

  function updateSelectedMeme(nextMemeId: number) {
    setSelectedMeme(nextMemeId);
    const nextQuery = getRememesBrowseQuery({
      locale,
      memeId: nextMemeId,
      searchParams,
    });
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  useEffect(() => {
    const filtersChanged =
      previousFilters.current.selectedMeme !== selectedMeme ||
      previousFilters.current.selectedSorting !== selectedSorting ||
      previousFilters.current.selectedTokenType !== selectedTokenType;

    previousFilters.current = {
      selectedMeme,
      selectedSorting,
      selectedTokenType,
    };

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    fetchResults(page);
    return () => {
      activeFetchRequest.current?.abort();
      activeFetchRequest.current = null;
    };
  }, [fetchResults, page, selectedMeme, selectedSorting, selectedTokenType]);

  function printRememe(rememe: Rememe) {
    const collectionName = getRememeCollectionName(rememe);
    const replicaCount = rememe.replicas.length;
    const replicaCountLabel = t(locale, "rememes.card.replicaCount", {
      count: formatInteger(locale, replicaCount),
    });
    const tokenId = rememe.id;
    const title = getRememeTitle(rememe);

    return (
      <li key={`${rememe.contract}-${rememe.id}`} className="tw-min-w-0">
        <Link
          href={getRememeDetailHref({
            contract: rememe.contract,
            id: rememe.id,
            locale,
          })}
          aria-label={t(locale, "rememes.card.linkAriaLabel", {
            name: title,
            tokenId,
          })}
          className="tw-group tw-flex tw-h-full tw-min-w-0 tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-white/20 hover:tw-bg-iron-900/50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          <div className="tw-bg-iron-900">
            <RememeImage nft={rememe} animation={false} height={300} />
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-px-2 tw-pb-4 tw-pt-4 tw-text-center md:tw-px-4">
            <div className="tw-line-clamp-2 tw-w-full tw-max-w-full tw-break-words tw-text-center tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-50 md:tw-text-md">
              {title}
            </div>
            <div className="tw-mt-2 tw-flex tw-min-h-5 tw-w-full tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-1.5 tw-gap-y-0.5 tw-text-center tw-text-xs tw-leading-5 tw-text-iron-500">
              <span className="tw-break-words">
                {collectionName}
                {replicaCount > 1 && <>&nbsp;{replicaCountLabel}</>}
              </span>
              <span aria-hidden="true" className="tw-shrink-0 tw-text-iron-600">
                &middot;
              </span>
              <span
                aria-label={t(locale, "rememes.card.tokenAriaLabel", {
                  tokenId,
                })}
                className="tw-min-w-0 tw-truncate tw-font-medium"
              >
                #{rememe.id}
              </span>
            </div>
          </div>
        </Link>
      </li>
    );
  }

  function printRememes() {
    if (rememes.length === 0) {
      return (
        <div>
          <NothingHereYetSummer />
        </div>
      );
    }
    return (
      <ul
        aria-label={t(locale, "rememes.results.gridLabel")}
        className={REMEMES_GRID_CLASS}
      >
        {rememes.map(printRememe)}
      </ul>
    );
  }

  return (
    <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
      <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-py-6 md:tw-px-6 md:tw-py-10 lg:tw-px-8">
        <header className="tw-pb-5">
          <div className="tw-flex tw-flex-col tw-gap-4">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
              <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-2 sm:tw-w-auto sm:tw-justify-start">
                <div className="tw-hidden tw-min-w-0 tw-items-center tw-gap-2 xl:tw-flex">
                  <Image
                    unoptimized
                    loading={"eager"}
                    width="0"
                    height="0"
                    style={{ width: "250px", height: "auto" }}
                    className="tw-hidden md:tw-block"
                    src="/re-memes.png"
                    alt={t(locale, "rememes.logoAlt")}
                  />
                  {totalResults > 0 && (
                    <span className={REMEMES_TOTAL_COUNT_CLASS}>
                      {t(locale, "rememes.results.count", {
                        count: formatInteger(locale, totalResults),
                      })}
                    </span>
                  )}
                </div>
                <div className="tw-min-w-0 xl:tw-hidden">
                  <CollectionsDropdown
                    activePage="rememes"
                    variant="brand"
                    triggerContent={
                      <span className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2">
                        <Image
                          unoptimized
                          loading={"eager"}
                          width="0"
                          height="0"
                          style={{ width: "150px", height: "auto" }}
                          className="tw-shrink tw-basis-auto"
                          src="/re-memes.png"
                          alt={t(locale, "rememes.logoAlt")}
                        />
                        {totalResults > 0 && (
                          <span className={REMEMES_TOTAL_COUNT_CLASS}>
                            {t(locale, "rememes.results.count", {
                              count: formatInteger(locale, totalResults),
                            })}
                          </span>
                        )}
                      </span>
                    }
                  />
                </div>
                <LFGButton contract={"rememes"} />
              </div>
              <div className="tw-flex tw-w-full tw-items-center sm:tw-w-auto sm:tw-justify-end">
                <div className="tw-w-full sm:tw-w-auto [&>a]:tw-w-full sm:[&>a]:tw-w-auto">
                  <Link
                    href={getRememesAddHref({ locale })}
                    aria-label={t(locale, "rememes.actions.add")}
                    className={ADD_REMEME_LINK_CLASS}
                  >
                    {t(locale, "rememes.actions.add")}
                    <PlusCircleIcon className="tw-size-4 tw-shrink-0 [stroke-width:2.25]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {rememesLoaded && (
          <div className="tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-6 tw-gap-y-2 tw-overflow-x-auto tw-overflow-y-hidden tw-py-2 tw-pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:tw-flex-wrap sm:tw-overflow-visible sm:tw-pb-2 md:tw-justify-between [&::-webkit-scrollbar]:tw-hidden">
            <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
              <CommonDropdown
                items={sortingItems}
                activeItem={selectedSorting}
                filterLabel={t(locale, "rememes.sorting.filterLabel")}
                setSelected={setSelectedSorting}
                size="sm"
                variant="editorial"
                showFilterLabel
              />
              {selectedSorting === RememeSort.RANDOM && (
                <>
                  <button
                    type="button"
                    aria-label={t(locale, "rememes.refresh.ariaLabel")}
                    onClick={() => fetchResults(page)}
                    data-tooltip-id="refresh-rememes-results"
                    className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition hover:tw-bg-white/[0.04] hover:tw-text-iron-200 focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                  >
                    <ArrowPathIcon className="tw-size-5" />
                  </button>
                  <Tooltip
                    id="refresh-rememes-results"
                    place="top"
                    opacity={1}
                    style={TOOLTIP_STYLES}
                  >
                    {t(locale, "rememes.refresh.tooltip")}
                  </Tooltip>
                </>
              )}
            </div>
            <div className="tw-flex tw-shrink-0 tw-flex-nowrap tw-items-center tw-gap-x-6 tw-gap-y-2 sm:tw-flex-wrap md:tw-ml-auto">
              <CommonDropdown
                items={tokenTypeItems}
                activeItem={selectedTokenType}
                filterLabel={t(locale, "rememes.tokenType.filterLabel")}
                setSelected={setSelectedTokenType}
                size="sm"
                variant="editorial"
                showFilterLabel
              />
              <div className="tw-shrink-0">
                <CommonDropdown
                  items={memeReferenceItems}
                  activeItem={selectedMeme}
                  filterLabel={t(locale, "rememes.memeReference.filterLabel")}
                  noneLabel={selectedMeme ? selectedMeme.toString() : undefined}
                  setSelected={updateSelectedMeme}
                  size="sm"
                  variant="editorial"
                  menuMinWidth={320}
                  showFilterLabel
                />
              </div>
            </div>
          </div>
        )}

        {rememesLoaded ? (
          printRememes()
        ) : (
          <div className="tw-pt-3">
            {t(locale, "rememes.loading.fetching")} <DotLoader />
          </div>
        )}
      </div>
      {totalResults > PAGE_SIZE && rememesLoaded && (
        <div className="tw-py-4 tw-text-center">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              if (typeof globalThis.scrollTo === "function") {
                globalThis.scrollTo(0, 0);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
