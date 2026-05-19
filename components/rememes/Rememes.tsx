"use client";

import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import RememeImage from "@/components/nft-image/RememeImage";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import Pagination from "@/components/pagination/Pagination";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { publicEnv } from "@/config/env";
import { OPENSEA_STORE_FRONT_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFTLite, Rememe } from "@/entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  numberWithCommas,
} from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { ArrowPathIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";

const PAGE_SIZE = 40;

enum TokenType {
  ALL = "All",
  ERC721 = "ERC-721",
  ERC1155 = "ERC-1155",
}

export enum RememeSort {
  RANDOM = "Random",
  CREATED_ASC = "Recently Added",
}

const FILTER_LABEL_CLASS =
  "tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-500";

const FILTER_INLINE_LABEL_CLASS =
  "tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-500";

const REMEMES_GRID_CLASS =
  "tw-grid tw-grid-cols-2 tw-gap-x-6 tw-pt-2 sm:tw-grid-cols-3 md:tw-grid-cols-4";

export default function Rememes() {
  useSetTitle("ReMemes | Collections");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [memes, setMemes] = useState<NFTLite[]>([]);

  const [rememes, setRememes] = useState<Rememe[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [rememesLoaded, setRememesLoaded] = useState(false);

  const tokenTypes = [TokenType.ALL, TokenType.ERC721, TokenType.ERC1155];
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType>(
    TokenType.ALL
  );

  const queryMemeId = searchParams.get("meme_id");
  const parsedQueryMemeId = queryMemeId ? Number.parseInt(queryMemeId) : 0;
  const [selectedMeme, setSelectedMeme] = useState<number>(
    Number.isFinite(parsedQueryMemeId) ? parsedQueryMemeId : 0
  );

  const sorting = [RememeSort.RANDOM, RememeSort.CREATED_ASC];
  const [selectedSorting, setSelectedSorting] = useState<RememeSort>(
    RememeSort.RANDOM
  );
  const sortingItems: CommonSelectItem<RememeSort>[] = sorting.map((sort) => ({
    label: sort,
    value: sort,
    key: `sorting-${sort}`,
  }));
  const tokenTypeItems: CommonSelectItem<TokenType>[] = tokenTypes.map(
    (tokenType) => ({
      label: tokenType,
      value: tokenType,
      key: `token-type-${tokenType}`,
    })
  );
  const memeReferenceItems: CommonSelectItem<number>[] = [
    { label: "All", value: 0, key: "meme-all" },
    ...memes.map((meme) => ({
      label: `#${meme.id} - ${meme.name}`,
      mobileLabel: `#${meme.id}`,
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

  useEffect(() => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (selectedMeme) {
      nextSearchParams.set("meme_id", selectedMeme.toString());
    } else {
      nextSearchParams.delete("meme_id");
    }

    const currentQuery = searchParams.toString();
    const nextQuery = nextSearchParams.toString();
    if (nextQuery !== currentQuery) {
      const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextPath, { scroll: false });
    }
  }, [pathname, router, searchParams, selectedMeme]);

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
    return (
      <a
        key={`${rememe.contract}-${rememe.id}`}
        href={`/rememes/${rememe.contract}/${rememe.id}`}
        className="tw-group tw-block tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-white/20 hover:tw-bg-iron-900/50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <div className="tw-relative tw-mb-2 tw-bg-iron-900">
          <RememeImage nft={rememe} animation={false} height={300} />
        </div>
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-center tw-gap-y-2 tw-px-2 tw-pb-4 tw-pt-4 tw-text-center md:tw-px-4">
          <div className="tw-w-full tw-max-w-full tw-text-center tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-100">
            {rememe.metadata.name
              ? rememe.metadata.name
              : `${formatAddress(rememe.contract)} #${rememe.id}`}
          </div>
          <div className="tw-min-h-5 tw-w-full tw-text-center tw-text-xs tw-leading-5 tw-text-iron-500">
            {areEqualAddresses(
              rememe.contract,
              OPENSEA_STORE_FRONT_CONTRACT
            ) ? (
              <>{rememe.contract_opensea_data.collectionName}</>
            ) : (
              <>
                {rememe.contract_opensea_data.collectionName
                  ? rememe.contract_opensea_data.collectionName
                  : formatAddress(rememe.contract)}{" "}
                #{rememe.id}
              </>
            )}
            {rememe.replicas.length > 1 && (
              <>&nbsp;(x{numberWithCommas(rememe.replicas.length)})</>
            )}
          </div>
        </div>
      </a>
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
    return <div className={REMEMES_GRID_CLASS}>{rememes.map(printRememe)}</div>;
  }

  return (
    <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-bg-[#0A0A0B] tw-pb-5 tw-text-white">
      <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-py-6 md:tw-px-6 md:tw-py-10 lg:tw-px-8">
        <div className="tw-mb-3 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-12">
          <div className="tw-pb-3 sm:tw-col-span-8 sm:tw-pb-0 md:tw-col-span-9">
            <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
              <span className="tw-hidden tw-items-center tw-gap-2 xl:tw-flex">
                <Image
                  unoptimized
                  loading={"eager"}
                  width="0"
                  height="0"
                  style={{ width: "250px", height: "auto" }}
                  className="tw-hidden md:tw-block"
                  src="/re-memes.png"
                  alt="re-memes"
                />
                {totalResults > 0 && (
                  <span className="tw-text-lg tw-text-iron-300">
                    (x{numberWithCommas(totalResults)})
                  </span>
                )}
              </span>
              <span className="xl:tw-hidden">
                <CollectionsDropdown
                  activePage="rememes"
                  variant="brand"
                  triggerContent={
                    <span className="tw-inline-flex tw-items-center tw-gap-2">
                      <Image
                        unoptimized
                        loading={"eager"}
                        width="0"
                        height="0"
                        style={{ width: "150px", height: "auto" }}
                        src="/re-memes.png"
                        alt="re-memes"
                      />
                      {totalResults > 0 && (
                        <span className="tw-text-lg tw-text-iron-300">
                          (x{numberWithCommas(totalResults)})
                        </span>
                      )}
                    </span>
                  }
                />
              </span>
              <LFGButton contract={"rememes"} />
            </span>
          </div>
          <div className="tw-flex tw-items-center sm:tw-col-span-4 sm:tw-justify-end md:tw-col-span-3">
            <div className="tw-w-full sm:tw-w-auto [&>button]:tw-w-full sm:[&>button]:tw-w-auto">
              <PrimaryButton
                loading={false}
                disabled={false}
                onClicked={() => {
                  window.location.href = "/rememes/add";
                }}
              >
                Add ReMeme
                <PlusCircleIcon className="tw-size-4 tw-shrink-0 [stroke-width:2.25]" />
              </PrimaryButton>
            </div>
          </div>
        </div>

        {rememesLoaded && (
          <div className="tw-flex tw-flex-col tw-gap-4 tw-py-2 xl:tw-flex-row xl:tw-items-center xl:tw-justify-between">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <span className={FILTER_LABEL_CLASS}>Sort:</span>
              <div className="tw-w-40">
                <CommonDropdown
                  items={sortingItems}
                  activeItem={selectedSorting}
                  filterLabel="Sort"
                  setSelected={setSelectedSorting}
                  size="sm"
                />
              </div>
              {selectedSorting === RememeSort.RANDOM && (
                <>
                  <button
                    type="button"
                    aria-label="Refresh results"
                    onClick={() => fetchResults(page)}
                    data-tooltip-id="refresh-rememes-results"
                    className="tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-white/[0.05] tw-text-iron-300 tw-transition hover:tw-border-white/25 hover:tw-bg-white/[0.07] hover:tw-text-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-white/20"
                  >
                    <ArrowPathIcon className="tw-size-5" />
                  </button>
                  <Tooltip
                    id="refresh-rememes-results"
                    place="top"
                    delayShow={250}
                    style={{
                      backgroundColor: "#f8f9fa",
                      color: "#212529",
                      padding: "4px 8px",
                    }}
                  >
                    Refresh results
                  </Tooltip>
                </>
              )}
            </div>
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-3 xl:tw-justify-end">
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className={FILTER_INLINE_LABEL_CLASS}>Token Type:</span>
                <div className="tw-w-[5.25rem]">
                  <CommonDropdown
                    items={tokenTypeItems}
                    activeItem={selectedTokenType}
                    filterLabel="Token Type"
                    setSelected={setSelectedTokenType}
                    size="sm"
                  />
                </div>
              </div>
              <span className="tw-hidden tw-h-8 tw-w-px tw-bg-iron-800 md:tw-block" />
              <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
                <span className={FILTER_INLINE_LABEL_CLASS}>
                  Meme Reference:
                </span>
                <div
                  className={selectedMeme === 0 ? "tw-w-[5.25rem]" : "tw-w-60"}
                >
                  <CommonDropdown
                    items={memeReferenceItems}
                    activeItem={selectedMeme}
                    filterLabel="Meme Reference"
                    setSelected={setSelectedMeme}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {rememesLoaded ? (
          printRememes()
        ) : (
          <div className="tw-pt-3">
            Fetching <DotLoader />
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
              window.scrollTo(0, 0);
            }}
          />
        </div>
      )}
    </div>
  );
}
