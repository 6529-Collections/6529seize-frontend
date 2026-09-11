"use client";

import {
  faArrowCircleRight,
  faChevronDown,
  faChevronRight,
  faChevronUp,
  faFilter,
  faFilterCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import type {
  NextGenCollection,
  TraitValuePair,
  TraitValues,
} from "@/entities/INextgen";
import { SortDirection } from "@/entities/ISort";
import { areEqualAddresses } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import DotLoader from "@/components/dotLoader/DotLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import {
  NextGenListFilters,
  NextGenTokenListedType,
  formatNameForUrl,
} from "@/components/nextGen/nextgen_helpers";
import { NextgenRarityToggle } from "../nextgenToken/NextGenTokenProperties";
import NextGenTokenList from "../NextGenTokenList";

interface Props {
  collection: NextGenCollection;
  show_view_all?: boolean | undefined;
}

export default function NextGenCollectionArt(props: Readonly<Props>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const initializedTraitFilterOpen = useRef(false);

  const locale = useBrowserLocale();

  useEffect(() => {
    if (globalThis.innerWidth <= 750) {
      setShowFilters(false);
    }
  }, []);

  const [traits, setTraits] = useState<TraitValues[]>([]);
  const [traitsLoaded, setTraitsLoaded] = useState(false);
  const [routerLoaded, setRouterLoaded] = useState(false);
  const [selectedTraitValues, setSelectedTraitValues] = useState<
    TraitValuePair[]
  >([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalResultsSet, setTotalResultsSet] = useState(false);
  const [sortDir, setSortDir] = useState(
    props.show_view_all ? SortDirection.ASC : SortDirection.DESC
  );
  const [sort, setSort] = useState(NextGenListFilters.ID);

  const [showNormalised, setShowNormalised] = useState(true);
  const [showTraitCount, setShowTraitCount] = useState(true);

  const [showFilters, setShowFilters] = useState(true);

  const [listedType, setListedType] = useState(NextGenTokenListedType.ALL);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [openTraitFilters, setOpenTraitFilters] = useState<string[]>([]);

  function isRaritySort(s: NextGenListFilters) {
    return [
      NextGenListFilters.RARITY_SCORE,
      NextGenListFilters.STATISTICAL_SCORE,
      NextGenListFilters.SINGLE_TRAIT_RARITY,
    ].includes(s);
  }

  function setTraitsQuery(q: string) {
    if (q) {
      const traitValues = q.split(",");
      const selectedTraits: TraitValuePair[] = [];
      traitValues.forEach((tv) => {
        const [t, v] = tv.split(":");
        if (
          traits.some(
            (tr) =>
              areEqualAddresses(tr.trait, t) &&
              tr.values.some((vl) => areEqualAddresses(vl, v))
          )
        ) {
          selectedTraits.push({
            trait: t!,
            value: v!,
          });
        }
      });
      setSelectedTraitValues(selectedTraits);
    } else {
      setSelectedTraitValues([]);
    }
  }

  useEffect(() => {
    if (traitsLoaded && !routerLoaded) {
      setTraitsQuery(searchParams?.get("traits") ?? "");
      const sortParam = searchParams?.get("sort");
      if (sortParam) {
        const sortQuery = sortParam as string;
        const newSort =
          NextGenListFilters[
            sortQuery?.toUpperCase() as keyof typeof NextGenListFilters
          ] || NextGenListFilters.ID;
        setSort(newSort);
        if (isRaritySort(newSort)) {
          const showNorm = searchParams?.get("show_normalised");
          if (showNorm) {
            setShowNormalised(showNorm === "true");
          }
          const showCount = searchParams?.get("show_trait_count");
          if (showCount) {
            setShowTraitCount(showCount === "true");
          }
        }
      }
      const sortDirParam = searchParams?.get("sort_direction");
      if (sortDirParam) {
        const sortDirQuery = sortDirParam as string;
        setSortDir(
          SortDirection[
            sortDirQuery?.toUpperCase() as keyof typeof SortDirection
          ] || SortDirection.DESC
        );
      }
      const listedParam = searchParams?.get("listed");
      if (listedParam) {
        const listedQuery = listedParam as string;
        setListedType(
          listedQuery === "true"
            ? NextGenTokenListedType.LISTED
            : NextGenTokenListedType.NOT_LISTED
        );
      }
      setRouterLoaded(true);
    }
  }, [searchParams, traitsLoaded, routerLoaded]);

  useEffect(() => {
    commonApiFetch<TraitValues[]>({
      endpoint: `nextgen/collections/${props.collection.id}/traits`,
    }).then((response) => {
      setTraits(response.filter((t) => t.trait !== "Collection Name"));
      setTraitsLoaded(true);
    });
  }, [props.collection.id]);

  useEffect(() => {
    if (!props.show_view_all && routerLoaded) {
      let query = "";
      if (selectedTraitValues.length > 0) {
        const traitsQ = selectedTraitValues
          .map((t) => `${t.trait}:${t.value}`)
          .join(",");
        query += `traits=${encodeURIComponent(traitsQ)}`;
      }
      if (sort) {
        query += `&sort=${sort.replaceAll(" ", "_").toLowerCase()}`;
      }
      if (sortDir) {
        query += `&sort_direction=${sortDir.toLowerCase()}`;
      }
      if (isRaritySort(sort)) {
        if (!showNormalised) {
          query += `&show_normalised=false`;
        }
        if (!showTraitCount) {
          query += `&show_trait_count=false`;
        }
      }
      if (listedType !== NextGenTokenListedType.ALL) {
        query += `&listed=${listedType === NextGenTokenListedType.LISTED}`;
      }
      router.push(
        `/nextgen/collection/${formatNameForUrl(props.collection.name)}/art${
          query ? `?${query}` : ""
        }`
      );
    }
  }, [
    routerLoaded,
    selectedTraitValues,
    sort,
    sortDir,
    showNormalised,
    showTraitCount,
    listedType,
  ]);

  useEffect(() => {
    if (totalResultsSet) {
      setTotalResultsSet(false);
    }
  }, [selectedTraitValues]);

  useEffect(() => {
    if (!routerLoaded || initializedTraitFilterOpen.current) {
      return;
    }

    const selectedTraits = traits
      .filter((trait) =>
        selectedTraitValues.some((selected) => selected.trait === trait.trait)
      )
      .map((trait) => trait.trait);

    if (selectedTraits.length > 0) {
      setOpenTraitFilters(selectedTraits);
    }

    initializedTraitFilterOpen.current = true;
  }, [routerLoaded, selectedTraitValues, traits]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        sortMenuRef.current &&
        event.target instanceof Node &&
        !sortMenuRef.current.contains(event.target)
      ) {
        setIsSortMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSortMenuOpen(false);
      }
    };

    globalThis.addEventListener("mousedown", handlePointerDown);
    globalThis.addEventListener("keydown", handleKeyDown);

    return () => {
      globalThis.removeEventListener("mousedown", handlePointerDown);
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleTraitValue(trait: string, value: string) {
    if (
      selectedTraitValues.some(
        (t) =>
          areEqualAddresses(t.trait, trait) && areEqualAddresses(t.value, value)
      )
    ) {
      setSelectedTraitValues(
        selectedTraitValues.filter(
          (t) =>
            !(
              areEqualAddresses(t.trait, trait) &&
              areEqualAddresses(t.value, value)
            )
        )
      );
    } else {
      setSelectedTraitValues([
        ...selectedTraitValues,
        {
          trait,
          value,
        },
      ]);
    }
  }

  function setTraitFilterOpen(trait: string, isOpen: boolean) {
    setOpenTraitFilters((current) =>
      isOpen
        ? Array.from(new Set([...current, trait]))
        : current.filter((currentTrait) => currentTrait !== trait)
    );
  }

  const selectClassName =
    "tw-cursor-pointer tw-appearance-none tw-border-0 tw-bg-transparent tw-p-0 tw-pr-6 tw-text-sm tw-font-semibold tw-text-white focus:tw-outline-none";
  const sortButtonClassName =
    "tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition hover:tw-border-white/20 hover:tw-bg-iron-800 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
  const sortMenuItemClassName =
    "tw-w-full tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-white tw-transition hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400";
  const sortMenuId = `nextgen-collection-art-sort-${props.collection.id}`;

  return (
    <div className="tw-w-full">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-3">
          <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-3xl">
            The Art
          </h2>
          {totalResultsSet ? (
            <span className="tw-inline-flex tw-rounded-full tw-bg-white/5 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-white/10">
              x{formatInteger(locale, totalResults)}
            </span>
          ) : (
            <DotLoader />
          )}
        </div>
        <div
          className={`tw-flex tw-items-center tw-gap-3 ${
            props.show_view_all
              ? "tw-ml-auto"
              : "tw-w-full tw-flex-wrap tw-justify-start md:tw-w-auto md:tw-justify-end"
          }`}
        >
          {props.show_view_all ? (
            <Link
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/art`}
              className="tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition hover:tw-bg-white/5 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              View All
              <FontAwesomeIcon
                icon={faArrowCircleRight}
                className="tw-h-5 tw-w-5"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                aria-label={`${showFilters ? "Hide" : "Show"} filters`}
                className="tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-white tw-ring-1 tw-ring-inset tw-ring-white/10 hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                data-tooltip-id={`nextgen-collection-art-filters-${props.collection.id}`}
              >
                <FontAwesomeIcon
                  icon={showFilters ? faFilterCircleXmark : faFilter}
                  className={`tw-h-[22px] ${
                    selectedTraitValues.length > 0
                      ? "tw-text-success"
                      : "tw-text-white"
                  }`}
                />
              </button>
              <Tooltip
                id={`nextgen-collection-art-filters-${props.collection.id}`}
                className="!tw-bg-iron-800 !tw-px-2 !tw-py-1 !tw-text-white"
                place="bottom"
                delayShow={250}
              >
                {`${showFilters ? "Hide" : "Show"} Filters${
                  selectedTraitValues.length > 0
                    ? ` (${selectedTraitValues.length} selected)`
                    : ""
                }`}
              </Tooltip>
              <label className="tw-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm focus-within:tw-ring-2 focus-within:tw-ring-primary-400">
                <span className="tw-font-semibold tw-text-iron-300">
                  Listing status
                </span>
                <span className="tw-relative tw-flex tw-items-center">
                  <select
                    value={listedType}
                    onChange={(event) =>
                      setListedType(
                        event.target.value as NextGenTokenListedType
                      )
                    }
                    className={`${selectClassName} tw-[color-scheme:dark]`}
                  >
                    {Object.values(NextGenTokenListedType).map((lt) => (
                      <option
                        key={`listed-type-${lt}`}
                        value={lt}
                        className="tw-bg-black tw-text-white"
                      >
                        {lt}
                      </option>
                    ))}
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="tw-pointer-events-none tw-absolute tw-right-0 tw-h-3 tw-w-3 tw-text-iron-400"
                    aria-hidden="true"
                  />
                </span>
              </label>
              <div className="tw-relative" ref={sortMenuRef}>
                <button
                  type="button"
                  className={sortButtonClassName}
                  aria-haspopup="true"
                  aria-controls={isSortMenuOpen ? sortMenuId : undefined}
                  aria-expanded={isSortMenuOpen}
                  onClick={() => setIsSortMenuOpen((isOpen) => !isOpen)}
                >
                  <span>Sort: {sort}</span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`tw-h-3 tw-w-3 tw-transition-transform ${
                      isSortMenuOpen ? "tw-rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isSortMenuOpen && (
                  <div
                    id={sortMenuId}
                    className="tw-[margin-top:0.5rem] tw-absolute tw-right-0 tw-top-full tw-z-50 tw-min-w-[240px] tw-rounded-md tw-bg-iron-900 tw-p-1 tw-shadow-lg tw-ring-1 tw-ring-white/10"
                  >
                    <div>
                      {Object.values(NextGenListFilters).map((lf) => (
                        <Fragment key={`sort-filter-${lf}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setSort(lf);
                              setIsSortMenuOpen(false);
                            }}
                            className={sortMenuItemClassName}
                          >
                            {lf}
                          </button>
                          {(lf === NextGenListFilters.ID ||
                            lf === NextGenListFilters.HIGHEST_SALE) && (
                            <div className="tw-my-1 tw-h-px tw-bg-white/10" />
                          )}
                        </Fragment>
                      ))}
                    </div>
                    <div className="tw-[margin-top:0.25rem] tw-space-y-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-px-2 tw-py-2">
                      <span className="tw-flex tw-items-center tw-gap-2">
                        <NextgenRarityToggle
                          disabled={!isRaritySort(sort)}
                          title={"Trait Normalization"}
                          show={showNormalised}
                          setShow={setShowNormalised}
                        />
                      </span>
                      <span className="tw-flex tw-items-center tw-gap-2">
                        <NextgenRarityToggle
                          title={"Trait Count"}
                          show={showTraitCount}
                          disabled={!isRaritySort(sort)}
                          setShow={setShowTraitCount}
                        />
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-1">
                <button
                  type="button"
                  onClick={() => setSortDir(SortDirection.ASC)}
                  aria-label="Sort ascending"
                  aria-pressed={sortDir === SortDirection.ASC}
                  className={`tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-transition focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                    sortDir === SortDirection.ASC
                      ? "tw-bg-iron-700 tw-text-white"
                      : "tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-white"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faChevronUp}
                    className="tw-h-4 tw-w-4"
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setSortDir(SortDirection.DESC)}
                  aria-label="Sort descending"
                  aria-pressed={sortDir === SortDirection.DESC}
                  className={`tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-transition focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                    sortDir === SortDirection.DESC
                      ? "tw-bg-iron-700 tw-text-white"
                      : "tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-white"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="tw-h-4 tw-w-4"
                    aria-hidden="true"
                  />
                </button>
              </span>
            </>
          )}
        </div>
      </div>
      <div
        className={`tw-mt-6 tw-grid tw-gap-6 ${
          !props.show_view_all && showFilters
            ? "md:tw-grid-cols-[minmax(220px,280px)_minmax(0,1fr)]"
            : ""
        }`}
      >
        {!props.show_view_all && showFilters && (
          <aside className="tw-h-fit tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-4 md:tw-sticky md:tw-top-4 md:tw-max-h-[calc(100vh-2rem)] md:tw-overflow-y-auto">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
              <span className="tw-flex tw-min-w-0 tw-flex-col sm:tw-flex-row sm:tw-items-baseline sm:tw-gap-2">
                <span className="tw-text-sm tw-font-normal tw-text-iron-200">
                  Traits
                </span>
                {selectedTraitValues.length > 0 && (
                  <span className="tw-text-xs tw-text-iron-400">
                    ({selectedTraitValues.length} selected)
                  </span>
                )}
              </span>
              {selectedTraitValues.length > 0 && (
                <button
                  className="tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-sm tw-text-iron-300 tw-underline hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  onClick={() => setSelectedTraitValues([])}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2">
              {routerLoaded &&
                traits.map((tr) => (
                  <details
                    key={`trait-filter-${tr.trait}`}
                    className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/70 tw-px-3"
                    open={openTraitFilters.includes(tr.trait)}
                    onToggle={(event) =>
                      setTraitFilterOpen(tr.trait, event.currentTarget.open)
                    }
                  >
                    <summary className="tw-flex tw-cursor-pointer tw-list-none tw-items-center tw-gap-2.5 tw-rounded-md tw-py-2 tw-font-normal tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 [&::-webkit-details-marker]:tw-hidden">
                      <FontAwesomeIcon
                        icon={
                          openTraitFilters.includes(tr.trait)
                            ? faChevronDown
                            : faChevronRight
                        }
                        className="tw-h-3 tw-w-3 tw-flex-none tw-text-iron-400"
                        aria-hidden="true"
                      />
                      <span className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-1.5">
                        <span>{tr.trait}</span>
                        <span className="tw-text-iron-400">
                          x{formatInteger(locale, tr.values.length)}
                        </span>
                      </span>
                    </summary>
                    {tr.value_counts.map((v) => {
                      const checked = selectedTraitValues.some(
                        (t) =>
                          areEqualAddresses(t.trait, tr.trait) &&
                          areEqualAddresses(t.value, v.key)
                      );
                      const inputId = `trait-${tr.trait.replaceAll(
                        " ",
                        "-"
                      )}-${v.key.replaceAll(" ", "-")}`;

                      return (
                        <div
                          key={`trait-filter-${tr.trait}-${v.key}`}
                          className="tw-py-1"
                        >
                          <label
                            htmlFor={inputId}
                            className="tw-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-py-1"
                          >
                            <input
                              id={inputId}
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTraitValue(tr.trait, v.key)}
                              className="tw-h-4 tw-w-4 tw-cursor-pointer tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-transparent tw-accent-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                            />
                            <span>
                              {v.key}{" "}
                              <span className="tw-text-iron-400">
                                x{formatInteger(locale, v.count)}
                              </span>
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </details>
                ))}
            </div>
          </aside>
        )}
        {(routerLoaded || totalResultsSet) && (
          <div className="tw-min-w-0">
            <NextGenTokenList
              limit={props.show_view_all ? 6 : undefined}
              collection={props.collection}
              sort={props.show_view_all ? undefined : sort}
              sort_direction={props.show_view_all ? undefined : sortDir}
              selected_traits={selectedTraitValues}
              show_normalised={showNormalised}
              show_trait_count={showTraitCount}
              listed_type={listedType}
              setTotalResults={(totalResults: number) => {
                setTotalResults(totalResults);
                setTotalResultsSet(true);
              }}
              show_pagination={!props.show_view_all}
            />
          </div>
        )}
      </div>
    </div>
  );
}
