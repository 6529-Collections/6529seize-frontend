"use client";

import {
  faArrowCircleRight,
  faChevronCircleDown,
  faChevronCircleUp,
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
import {
  NextGenListFilters,
  NextGenTokenListedType,
  formatNameForUrl,
} from "@/components/nextGen/nextgen_helpers";
import styles from "../NextGen.module.scss";
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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const screenSize = window.innerWidth;
    if (screenSize <= 750) {
      setShowFilters(false);
      setIsMobile(true);
    } else {
      setShowFilters(true);
      setIsMobile(false);
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
    const selectedTraits = traits
      .filter((trait) =>
        selectedTraitValues.some((selected) => selected.trait === trait.trait)
      )
      .map((trait) => trait.trait);

    if (selectedTraits.length > 0) {
      setOpenTraitFilters((current) =>
        Array.from(new Set([...current, ...selectedTraits]))
      );
    }
  }, [selectedTraitValues, traits]);

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

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
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
    "tw-cursor-pointer tw-rounded-md tw-border-0 tw-bg-transparent tw-py-1 tw-pl-1 tw-pr-8 tw-font-bold tw-text-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400";
  const sortButtonClassName =
    "tw-rounded-md tw-border-0 tw-bg-transparent tw-px-5 tw-py-1.5 tw-text-white hover:tw-text-iron-350 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400";
  const sortMenuItemClassName =
    "tw-w-full tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-white tw-transition hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400";
  const sortMenuId = `nextgen-collection-art-sort-${props.collection.id}`;

  return (
    <div className="tw-[padding-top:0.5rem] tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="no-wrap tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-items-center tw-justify-between tw-px-3">
          <h3 className="tw-[margin-bottom:0]">
            The Art{" "}
            {totalResultsSet ? (
              <span className="font-color-h font-smaller">
                (x{totalResults.toLocaleString()})
              </span>
            ) : (
              <DotLoader />
            )}
          </h3>
        </div>
        <div
          className={`tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-items-center tw-px-3 ${
            isMobile
              ? "tw-[padding-top:1rem] tw-justify-between"
              : "tw-justify-end"
          }`}
        >
          {props.show_view_all ? (
            <Link
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/art`}
              className={`decoration-none tw-flex tw-items-center tw-gap-2 ${styles["viewAllTokens"]}`}
            >
              <h5 className="font-color tw-[margin-bottom:0] tw-flex tw-items-center tw-gap-2">
                View All
                <FontAwesomeIcon
                  icon={faArrowCircleRight}
                  className={styles["viewAllIcon"]}
                />
              </h5>
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                aria-label={`${showFilters ? "Hide" : "Show"} filters`}
                className="tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                data-tooltip-id={`nextgen-collection-art-filters-${props.collection.id}`}
              >
                <FontAwesomeIcon
                  icon={showFilters ? faFilterCircleXmark : faFilter}
                  style={{
                    height: "22px",
                    color: selectedTraitValues.length > 0 ? "#00dd00" : "white",
                  }}
                />
              </button>
              <Tooltip
                id={`nextgen-collection-art-filters-${props.collection.id}`}
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
                place="bottom"
                delayShow={250}
              >
                {`${showFilters ? "Hide" : "Show"} Filters${
                  selectedTraitValues.length > 0
                    ? ` (${selectedTraitValues.length} selected)`
                    : ""
                }`}
              </Tooltip>
              <label className="tw-flex tw-items-center tw-gap-2 tw-font-bold">
                <span>Listing Status:</span>
                <select
                  value={listedType}
                  onChange={(event) =>
                    setListedType(event.target.value as NextGenTokenListedType)
                  }
                  className={selectClassName}
                  style={{ colorScheme: "dark" }}
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
                  Sort: {sort}
                </button>
                {isSortMenuOpen && (
                  <div
                    id={sortMenuId}
                    role="group"
                    aria-label="Sort options"
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
              <span
                className="tw-flex tw-items-center tw-gap-2"
                style={{
                  paddingLeft: "15px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSortDir(SortDirection.ASC)}
                  aria-label="Sort ascending"
                  aria-pressed={sortDir === SortDirection.ASC}
                  className="tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                >
                  <FontAwesomeIcon
                    icon={faChevronCircleUp}
                    style={{
                      height: "22px",
                      color:
                        sortDir === SortDirection.ASC ? "white" : "#9a9a9a",
                    }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setSortDir(SortDirection.DESC)}
                  aria-label="Sort descending"
                  aria-pressed={sortDir === SortDirection.DESC}
                  className="tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                >
                  <FontAwesomeIcon
                    icon={faChevronCircleDown}
                    style={{
                      height: "22px",
                      color:
                        sortDir === SortDirection.DESC ? "white" : "#9a9a9a",
                    }}
                  />
                </button>
              </span>
            </>
          )}
        </div>
      </div>
      <hr />
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        {!props.show_view_all && showFilters && (
          <div
            className="tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/4 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
            style={{ maxWidth: "100%" }}
          >
            <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
              <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                <div
                  className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-items-center tw-justify-between tw-px-3"
                  style={{ maxWidth: "100%" }}
                >
                  <span className="tw-flex tw-flex-col">
                    <span className="font-color-h font-bolder font-larger">
                      Traits
                    </span>
                    {selectedTraitValues.length > 0 && (
                      <span className="font-color-h font-smaller">
                        ({selectedTraitValues.length} selected)
                      </span>
                    )}
                  </span>
                  {selectedTraitValues.length > 0 && (
                    <button
                      className="font-cmaller decoration-hover-underline tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit tw-underline"
                      onClick={() => setSelectedTraitValues([])}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                <div className="tw-[padding-top:0.5rem] tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-flex-col tw-px-3">
                  {routerLoaded &&
                    traits.map((tr) => (
                      <details
                        key={`trait-filter-${tr.trait}`}
                        className={`${styles["traitsAccordion"]} ${styles["traitsAccordionItem"]}`}
                        open={openTraitFilters.includes(tr.trait)}
                        onToggle={(event) =>
                          setTraitFilterOpen(tr.trait, event.currentTarget.open)
                        }
                      >
                        <summary className="tw-cursor-pointer tw-bg-[rgb(34,34,34)] tw-py-2 tw-font-bold focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400">
                          <span>{tr.trait}</span>&nbsp;&nbsp;
                          <span className="font-color-h">
                            x{tr.values.length}
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
                              className={`${styles["traitsAccordionBody"]} tw-py-1`}
                            >
                              <label
                                htmlFor={inputId}
                                className="tw-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-py-1"
                              >
                                <input
                                  id={inputId}
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    toggleTraitValue(tr.trait, v.key)
                                  }
                                  className="tw-h-4 tw-w-4 tw-cursor-pointer tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-transparent tw-accent-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                                />
                                <span>
                                  {v.key}{" "}
                                  <span className="font-color-h">
                                    x{v.count}
                                  </span>
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </details>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {(routerLoaded || totalResultsSet) && (
          <div
            className={`tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto ${props.show_view_all || !showFilters ? "md:tw-w-full" : "md:tw-w-3/4"}`}
            style={{ maxWidth: "100%" }}
          >
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
