"use client";

import RememeImage from "@/components/nft-image/RememeImage";
import Pagination from "@/components/pagination/Pagination";
import { printMemeReferences } from "@/components/rememes/RememePage";
import { RememeSort } from "@/components/rememes/rememesTypes";
import { publicEnv } from "@/config/env";
import { OPENSEA_STORE_FRONT_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT, Rememe } from "@/entities/INFT";
import { areEqualAddresses, formatAddress } from "@/helpers/Helpers";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { getRememeSortLabel } from "../rememes/rememesI18n";
import { getRememeDetailHref } from "../rememes/rememesRouteParams";
import styles from "./TheMemes.module.scss";

const REMEMES_PAGE_SIZE = 20;
const REMEME_SORTING = [RememeSort.RANDOM, RememeSort.CREATED_ASC] as const;

type MemeLabReferencesState = {
  readonly loaded: boolean;
  readonly nfts: NFT[];
};

type MemeLabReferencesAction =
  | { readonly type: "loadSuccess"; readonly nfts: NFT[] }
  | { readonly type: "loadError" };

type RememesReferencesState = {
  readonly totalResults: number;
  readonly page: number;
  readonly items: Rememe[];
  readonly showSort: boolean;
  readonly loaded: boolean;
  readonly selectedSorting: RememeSort;
};

type RememesReferencesAction =
  | {
      readonly type: "loadSuccess";
      readonly totalResults: number;
      readonly items: Rememe[];
    }
  | { readonly type: "loadError" }
  | { readonly type: "setPage"; readonly page: number }
  | { readonly type: "setSorting"; readonly sorting: RememeSort };

const INITIAL_MEME_LAB_REFERENCES_STATE: MemeLabReferencesState = {
  loaded: false,
  nfts: [],
};

const INITIAL_REMEMES_REFERENCES_STATE: RememesReferencesState = {
  totalResults: 0,
  page: 1,
  items: [],
  showSort: false,
  loaded: false,
  selectedSorting: RememeSort.RANDOM,
};

function memeLabReferencesReducer(
  _state: MemeLabReferencesState,
  action: MemeLabReferencesAction
): MemeLabReferencesState {
  switch (action.type) {
    case "loadSuccess":
      return {
        loaded: true,
        nfts: action.nfts,
      };
    case "loadError":
      return {
        loaded: true,
        nfts: [],
      };
    default: {
      const unhandled: never = action;
      throw new Error(
        `Unhandled MemeLabReferencesAction: ${String(unhandled)}`
      );
    }
  }
}

function rememesReferencesReducer(
  state: RememesReferencesState,
  action: RememesReferencesAction
): RememesReferencesState {
  switch (action.type) {
    case "loadSuccess":
      return {
        ...state,
        totalResults: action.totalResults,
        items: action.items,
        showSort: action.totalResults > REMEMES_PAGE_SIZE,
        loaded: true,
      };
    case "loadError":
      return {
        ...state,
        totalResults: 0,
        items: [],
        showSort: false,
        loaded: true,
      };
    case "setPage":
      return {
        ...state,
        page: action.page,
      };
    case "setSorting":
      return {
        ...state,
        page: 1,
        totalResults: 0,
        selectedSorting: action.sorting,
      };
    default: {
      const unhandled: never = action;
      throw new Error(
        `Unhandled RememesReferencesAction: ${String(unhandled)}`
      );
    }
  }
}

function buildRememesUrl(memeId: number, page: number, sorting: RememeSort) {
  const sort =
    sorting === RememeSort.CREATED_ASC
      ? "&sort=created_at&sort_direction=desc"
      : "";

  return `${publicEnv.API_ENDPOINT}/api/rememes?meme_id=${memeId}&page_size=${REMEMES_PAGE_SIZE}&page=${page}${sort}`;
}

function getRememeName(rememe: Rememe) {
  const metadata = rememe.metadata as unknown;
  if (
    metadata !== null &&
    typeof metadata === "object" &&
    "name" in metadata &&
    typeof metadata.name === "string" &&
    metadata.name.trim()
  ) {
    return metadata.name;
  }
  return `${formatAddress(rememe.contract)} #${rememe.id}`;
}

export function MemePageReferencesSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  locale?: SupportedLocale | undefined;
}) {
  const locale = props.locale ?? DEFAULT_LOCALE;
  const [memeLabState, setMemeLabNfts] = useReducer(
    memeLabReferencesReducer,
    INITIAL_MEME_LAB_REFERENCES_STATE
  );
  const [rememesState, dispatchRememesState] = useReducer(
    rememesReferencesReducer,
    INITIAL_REMEMES_REFERENCES_STATE
  );

  const rememesTarget = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  function refreshRememes(memeId: number) {
    void fetchUrl(
      buildRememesUrl(memeId, rememesState.page, rememesState.selectedSorting)
    )
      .then((response: DBResponse) => {
        dispatchRememesState({
          type: "loadSuccess",
          totalResults: response.count,
          items: response.data,
        });
      })
      .catch(() => {
        dispatchRememesState({ type: "loadError" });
      });
  }

  useEffect(() => {
    if (props.show && props.nft) {
      void fetchUrl(
        `${publicEnv.API_ENDPOINT}/api/nfts_memelab?sort_direction=asc&meme_id=${props.nft.id}`
      )
        .then((response: DBResponse) => {
          setMemeLabNfts({
            type: "loadSuccess",
            nfts: response.data,
          });
        })
        .catch(() => {
          setMemeLabNfts({ type: "loadError" });
        });
    }
  }, [props.show, props.nft]);

  useEffect(() => {
    if (props.show && props.nft) {
      void fetchUrl(
        buildRememesUrl(
          props.nft.id,
          rememesState.page,
          rememesState.selectedSorting
        )
      )
        .then((response: DBResponse) => {
          dispatchRememesState({
            type: "loadSuccess",
            totalResults: response.count,
            items: response.data,
          });
        })
        .catch(() => {
          dispatchRememesState({ type: "loadError" });
        });
    }
  }, [props.show, props.nft, rememesState.page, rememesState.selectedSorting]);

  useEffect(() => {
    function closeDropdown(event: MouseEvent) {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    }

    function closeDropdownOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSortDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", closeDropdown);
    document.addEventListener("keydown", closeDropdownOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeDropdown);
      document.removeEventListener("keydown", closeDropdownOnEscape);
    };
  }, []);

  if (!props.show) {
    return <></>;
  }

  const selectedRememeSortingLabel = getRememeSortLabel(
    rememesState.selectedSorting,
    locale
  );

  return (
    <>
      <div className="tw-pt-3">
        <div>
          <Image
            unoptimized
            width="0"
            height="0"
            style={{ width: "250px", height: "auto" }}
            src="/memelab.png"
            alt={t(locale, "theMemes.detail.references.memeLab.logoAlt")}
          />
        </div>
      </div>
      <div className="tw-pb-2 tw-pt-4">
        <div>{t(locale, "theMemes.detail.references.memeLab.description")}</div>
      </div>
      {printMemeReferences(
        memeLabState.nfts,
        "meme-lab",
        memeLabState.loaded,
        true,
        locale
      )}
      <div className="tw-pt-3" ref={rememesTarget}>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between">
          <h1 className="tw-mb-0 tw-pt-2">
            <Image
              unoptimized
              width="0"
              height="0"
              style={{ width: "250px", height: "auto", float: "left" }}
              src="/re-memes.png"
              alt={t(locale, "theMemes.detail.references.rememes.logoAlt")}
            />
          </h1>
          {rememesState.showSort && (
            <span className="tw-flex tw-items-center tw-gap-2 tw-pt-2">
              <div
                className={`${styles["rememesSortDropdown"]} tw-relative`}
                ref={sortDropdownRef}
              >
                <button
                  type="button"
                  onClick={() => setSortDropdownOpen((open) => !open)}
                  aria-expanded={sortDropdownOpen}
                  aria-haspopup="menu"
                >
                  {t(locale, "theMemes.detail.references.sort.trigger", {
                    sort: selectedRememeSortingLabel,
                  })}
                </button>
                {sortDropdownOpen && (
                  <div
                    className="tw-absolute tw-left-1/2 tw-top-full tw-z-50 tw-mt-0 tw-max-h-[65vh] tw-min-w-[12rem] -tw-translate-x-1/2 tw-overflow-y-auto tw-border-0 tw-border-t-[3px] tw-border-solid tw-border-t-white tw-bg-iron-950 tw-py-2 tw-shadow-md"
                    role="menu"
                  >
                    {REMEME_SORTING.map((s) => (
                      <button
                        type="button"
                        key={`sorting-${s}`}
                        className="tw-block tw-w-[98%] tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-iron-100 desktop-hover:hover:tw-bg-iron-800 focus:tw-bg-transparent"
                        onClick={() => {
                          dispatchRememesState({
                            type: "setSorting",
                            sorting: s,
                          });
                          setSortDropdownOpen(false);
                        }}
                        role="menuitem"
                      >
                        {getRememeSortLabel(s, locale)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {rememesState.selectedSorting === RememeSort.RANDOM && (
                <>
                  <button
                    type="button"
                    aria-label={t(
                      locale,
                      "theMemes.detail.references.refresh.ariaLabel"
                    )}
                    className={`${styles["buttonIcon"]} tw-inline-flex tw-min-h-6 tw-min-w-6 tw-items-center tw-justify-center tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400`}
                    onClick={() => {
                      if (props.nft) {
                        refreshRememes(props.nft.id);
                      }
                    }}
                    data-tooltip-id="refresh-rememes"
                  >
                    <FontAwesomeIcon icon={faRefresh} aria-hidden="true" />
                  </button>
                  <Tooltip
                    id="refresh-rememes"
                    place="top"
                    delayShow={250}
                    style={{
                      backgroundColor: "#f8f9fa",
                      color: "#212529",
                      padding: "4px 8px",
                    }}
                  >
                    {t(locale, "theMemes.detail.references.refresh.tooltip")}
                  </Tooltip>
                </>
              )}
            </span>
          )}
        </div>
      </div>
      <div className="tw-pb-2 tw-pt-4">
        <div>{t(locale, "theMemes.detail.references.rememes.description")}</div>
      </div>
      {rememesState.loaded && rememesState.items.length === 0 && (
        <div className="tw-pb-4 tw-pt-2">
          <div>{t(locale, "theMemes.detail.references.empty.rememes")}</div>
        </div>
      )}
      {rememesState.items.length > 0 && (
        <>
          <div className="tw-grid tw-grid-cols-2 tw-py-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-grid-cols-4">
            {rememesState.items.map((rememe) => {
              return (
                <div
                  key={`${rememe.contract}-${rememe.id}`}
                  className="tw-py-3"
                >
                  <Link
                    href={getRememeDetailHref({
                      contract: rememe.contract,
                      id: rememe.id,
                      locale,
                    })}
                    aria-label={t(locale, "rememes.card.linkAriaLabel", {
                      name: getRememeName(rememe),
                      tokenId: rememe.id,
                    })}
                    className="decoration-none scale-hover"
                  >
                    <div className="tw-w-full">
                      <div>
                        <RememeImage
                          nft={rememe}
                          animation={false}
                          height={300}
                        />
                      </div>
                      <div>
                        <div className="tw-container tw-mx-auto">
                          <div>
                            <div className="font-smaller font-color-h tw-flex tw-items-center tw-justify-center">
                              {areEqualAddresses(
                                rememe.contract,
                                OPENSEA_STORE_FRONT_CONTRACT
                              ) ? (
                                <>
                                  {
                                    rememe.contract_opensea_data
                                      .collectionName
                                  }
                                </>
                              ) : (
                                <>
                                  {rememe.contract_opensea_data.collectionName
                                    ? rememe.contract_opensea_data
                                        .collectionName
                                    : formatAddress(rememe.contract)}{" "}
                                  #{rememe.id}
                                </>
                              )}
                              {rememe.replicas.length > 1 && (
                                <>
                                  &nbsp;
                                  {t(locale, "rememes.card.replicaCount", {
                                    count: formatInteger(
                                      locale,
                                      rememe.replicas.length
                                    ),
                                  })}
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="tw-flex tw-items-center tw-justify-center">
                              <span className="tw-text-center">
                                {getRememeName(rememe)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
          {rememesState.totalResults > REMEMES_PAGE_SIZE && (
            <div className="tw-pb-3 tw-pt-2 tw-text-center">
              <Pagination
                page={rememesState.page}
                pageSize={REMEMES_PAGE_SIZE}
                totalResults={rememesState.totalResults}
                setPage={function (newPage: number) {
                  dispatchRememesState({
                    type: "setPage",
                    page: newPage,
                  });
                  if (rememesTarget.current) {
                    rememesTarget.current.scrollIntoView({
                      behavior: "smooth",
                    });
                  }
                }}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
