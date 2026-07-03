"use client";

import {
  faArrowCircleRight,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import type { DBResponse } from "@/entities/IDBResponse";
import type {
  NextGenCollection,
  NextgenTraitSet,
  TraitValues,
} from "@/entities/INextgen";
import { capitalizeEveryWord, formatAddress } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import DotLoader from "@/components/dotLoader/DotLoader";
import Pagination from "@/components/pagination/Pagination";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "@/components/searchModal/SearchModal";
import UserCICAndLevel from "@/components/user/utils/UserCICAndLevel";
import {
  formatNameForUrl,
  normalizeNextgenTokenID,
} from "@/components/nextGen/nextgen_helpers";
import styles from "../NextGen.module.css";
import {
  getNextGenIconUrl,
  getNextGenImageUrl,
} from "../nextgenToken/NextGenTokenImage";
import NextGenCollectionHeader from "./NextGenCollectionHeader";

const TRAITS: Record<number, string[]> = {
  1: ["Palette", "Size", "Traced"],
  2: ["Border", "Color"],
};

const ULTIMATE = "Ultimate";

export default function NextGenTraitSets(
  props: Readonly<{
    collection: NextGenCollection;
    preview?: boolean | undefined;
  }>
) {
  const [page, setPage] = useState(1);

  const PAGE_SIZE = props.preview ? 10 : 25;

  const availableTraits: string[] = TRAITS[props.collection.id] ?? [];

  const [selectedTrait, setSelectedTrait] = useState<string>(
    availableTraits[0]!
  );

  const [selectedTraitValues, setSelectedTraitValues] = useState<string[]>([]);

  const [sets, setSets] = useState<NextgenTraitSet[]>([]);
  const [setsLoaded, setSetsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const [traits, setTraits] = useState<TraitValues[]>([]);
  const [traitsLoaded, setTraitsLoaded] = useState(false);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  useEffect(() => {
    commonApiFetch<TraitValues[]>({
      endpoint: `nextgen/collections/${props.collection.id}/traits`,
    }).then((response) => {
      setTraits(response.filter((t) => t.trait !== "Collection Name"));
      setTraitsLoaded(true);
    });
  }, [props.collection.id]);

  function fetchResults(mypage: number, mytrait: string) {
    setSetsLoaded(false);
    let path;
    if (selectedTrait === ULTIMATE) {
      path = `nextgen/collections/${
        props.collection.id
      }/ultimate_trait_set?trait=${availableTraits.join(
        ","
      )}&page_size=${PAGE_SIZE}&page=${mypage}`;
    } else {
      let filters = "";
      if (searchWallets.length > 0) {
        filters += `&search=${searchWallets.join(",")}`;
      }
      path = `nextgen/collections/${props.collection.id}/trait_sets/${mytrait}?&page_size=${PAGE_SIZE}&page=${mypage}${filters}`;
    }
    commonApiFetch<DBResponse>({
      endpoint: path,
    }).then((response) => {
      setTotalResults(response.count ?? 0);
      setSets(response.data ?? []);
      setSetsLoaded(true);
    });
  }

  useEffect(() => {
    if (selectedTrait && traitsLoaded) {
      setSelectedTraitValues(
        traits.find((t) => t.trait === selectedTrait)?.values ?? []
      );
      if (page === 1) {
        fetchResults(page, selectedTrait);
      } else {
        setPage(1);
      }
    }
  }, [selectedTrait, traitsLoaded, searchWallets]);

  useEffect(() => {
    if (selectedTrait && traitsLoaded) {
      fetchResults(page, selectedTrait);
    }
  }, [page]);

  function printTraitPill(t: string) {
    return (
      <div
        key={t}
        className="tw-relative tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
        style={{
          maxWidth: "100%",
          width: `${(12 / (availableTraits.length + 1) / 12) * 100}%`,
        }}
      >
        <button
          className={`${styles["collectorSetPill"]} ${
            t === selectedTrait ? styles["collectorSetPillSelected"] : ""
          }`}
          onClick={() => {
            if (selectedTrait === ULTIMATE || t === ULTIMATE) {
              setSets([]);
              setTotalResults(0);
            }
            setSelectedTrait(t);
          }}
        >
          {t}
        </button>
      </div>
    );
  }

  function printUltimate() {
    let content;
    if (!setsLoaded) {
      content = (
        <div
          className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3"
          style={{
            minHeight: "50vh",
          }}
        >
          <DotLoader />
        </div>
      );
    } else if (totalResults == 0) {
      content = (
        <div
          className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-flex-col tw-gap-2 tw-px-3"
          style={{
            minHeight: "50vh",
          }}
        >
          <span>None!</span>
          <span>
            <Image
              unoptimized
              priority
              loading="eager"
              width={0}
              height={0}
              style={{
                height: "60vh",
                width: "auto",
              }}
              src="/nextgen/none-ultimate.jpeg"
              alt="None Balloon"
            />
          </span>
        </div>
      );
    } else {
      content = (
        <div
          className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3"
          style={{
            minHeight: "50vh",
          }}
        >
          {sets.map((s) => (
            <UltimateOwner key={`ultimate-owner-${s.owner}`} set={s} />
          ))}
        </div>
      );
    }
    return (
      <div className="tw-pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
        {content}
      </div>
    );
  }

  return (
    <div className="tw-pb-12 tw-pt-2 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      {!props.preview && (
        <div className="tw-pb-6 -tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <NextGenCollectionHeader
              collection={props.collection}
              collection_link={true}
            />
          </div>
        </div>
      )}
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-items-center tw-justify-between tw-gap-4 tw-px-3">
          <h1 className="tw-whitespace-nowrap tw-min-w-fit">Trait Sets</h1>
          {props.preview && (
            <Link
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/trait-sets`}
              className={`tw-no-underline tw-flex tw-items-center tw-gap-2 ${styles["viewAllTokens"]}`}
            >
              <h5 className="tw-text-white tw-mb-0 tw-flex tw-items-center tw-gap-2">
                View All
                <FontAwesomeIcon
                  icon={faArrowCircleRight}
                  className={styles["viewAllIcon"]}
                />
              </h5>
            </Link>
          )}
          {!props.preview && (
            <SearchWalletsDisplay
              searchWallets={searchWallets}
              setSearchWallets={setSearchWallets}
              setShowSearchModal={setShowSearchModal}
            />
          )}
        </div>
      </div>
      <div className="tw-pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
            <div className="-tw-mx-3 tw-flex tw-flex-wrap">
              {availableTraits.map((trait) => printTraitPill(trait))}
              {printTraitPill(ULTIMATE)}
            </div>
          </div>
        </div>
      </div>
      {selectedTrait !== ULTIMATE && (
        <div className="tw-pt-6 -tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-items-center tw-justify-between tw-px-3">
            <span>
              {traitsLoaded ? (
                <>
                  Unique values for <b>{selectedTrait}</b> trait: x
                  {selectedTraitValues.length.toLocaleString()}
                </>
              ) : (
                <DotLoader />
              )}
            </span>
            <span>
              {!setsLoaded ? (
                <DotLoader />
              ) : (
                <>Collectors Count: {totalResults.toLocaleString()}</>
              )}
            </span>
          </div>
        </div>
      )}
      {selectedTrait === ULTIMATE && (
        <div className="tw-pt-6 -tw-mx-3 tw-flex tw-flex-wrap">
          <div
            className="tw-text-lg tw-font-bold tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
            style={{ maxWidth: "100%" }}
          >
            <u>{ULTIMATE} Set</u>
          </div>
          <div
            className="tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
            style={{ maxWidth: "100%" }}
          >{`All ${availableTraits.join(", All ")} Types`}</div>
        </div>
      )}
      {selectedTrait !== ULTIMATE && (
        <div className="tw-pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
          <div
            className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3"
            style={{
              minHeight: "50vh",
            }}
          >
            {!setsLoaded ? (
              <DotLoader />
            ) : (
              sets.map((s) => (
                <TraitSetAccordion
                  key={`collector-sets-${s.owner}`}
                  collection={props.collection}
                  trait={selectedTrait}
                  set={s}
                  values={selectedTraitValues}
                />
              ))
            )}
          </div>
        </div>
      )}
      {selectedTrait !== ULTIMATE && setsLoaded && sets.length === 0 && (
        <>No results found</>
      )}
      {selectedTrait === ULTIMATE && printUltimate()}
      {!props.preview &&
        totalResults > 0 &&
        totalResults / PAGE_SIZE > 1 &&
        setsLoaded && (
          <div className="tw-pb-4 tw-pt-2 -tw-mx-3 tw-flex tw-flex-wrap tw-text-center">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalResults={totalResults}
              setPage={function (newPage: number) {
                setPage(newPage);
              }}
            />
          </div>
        )}
      {!props.preview ? (
        <SearchModalDisplay
          show={showSearchModal}
          setShow={setShowSearchModal}
          searchWallets={searchWallets}
          setSearchWallets={setSearchWallets}
        />
      ) : (
        setsLoaded && (
          <div className="tw-pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <Link
                href={`/nextgen/collection/${formatNameForUrl(
                  props.collection.name
                )}/trait-sets`}
                className={`tw-no-underline tw-flex tw-items-center tw-justify-center tw-gap-2 ${styles["viewAllTokens"]}`}
              >
                <h5 className="tw-text-white tw-mb-0 tw-flex tw-items-center tw-gap-2">
                  View All Trait Sets
                  <FontAwesomeIcon
                    icon={faArrowCircleRight}
                    className={styles["viewAllIcon"]}
                  />
                </h5>
              </Link>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function UltimateOwner(props: Readonly<{ set: NextgenTraitSet }>) {
  const set = props.set;
  const keys = Object.entries(set)
    .filter(([key]) => key.endsWith("_sets"))
    .map(([key, value]) => {
      return {
        key: capitalizeEveryWord(key.replace("_sets", "")),
        count: value,
      };
    });

  return (
    <div className="tw-py-1">
      <div className={styles["collectorSetAccordionButtonUltimate"]}>
        <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-justify-between tw-px-3">
              <span>
                <Owner set={set} />
              </span>
              <span className="tw-flex tw-gap-4">
                {keys.map((k) => (
                  <span key={`ultimate-owner-${set.owner}-${k.key}`}>
                    <b>{k.key}</b> Sets: {k.count}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Owner(props: Readonly<{ set: NextgenTraitSet }>) {
  function getOwnerDisplay() {
    if (props.set.normalised_handle) {
      return props.set.normalised_handle;
    }
    if (
      props.set.consolidation_display?.includes("-") ||
      props.set.consolidation_display?.includes(".eth")
    ) {
      return props.set.consolidation_display;
    }

    return formatAddress(props.set.owner);
  }

  return (
    <Link
      className="tw-no-underline hover:tw-underline tw-flex tw-gap-2"
      onClick={(e) => e.stopPropagation()}
      href={`/${props.set.handle ?? props.set.owner}`}
    >
      <UserCICAndLevel level={props.set.level} /> {getOwnerDisplay()}
    </Link>
  );
}
function TraitSetAccordion(
  props: Readonly<{
    collection: NextGenCollection;
    trait: string;
    set: NextgenTraitSet;
    values: string[];
  }>
) {
  const set = props.set;

  const missingValues = props.values.filter(
    (v) => !set.token_values?.map((tv) => tv.value).includes(v)
  );

  return (
    <details className="tw-py-1">
      <summary className="tw-cursor-pointer tw-py-2 focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400">
        <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-4 tw-px-3">
              <span>
                <b>{set.distinct_values_count}</b>
              </span>
              <span>-</span>
              <span>
                <Owner set={set} />
              </span>
              {props.values.length > 0 && missingValues.length === 0 && (
                <>
                  <FontAwesomeIcon
                    style={{ height: "1.5em", color: "#00aa00" }}
                    icon={faCheckCircle}
                    data-tooltip-id={`complete-trait-${props.collection.id}-${props.trait}-${set.owner}`}
                  ></FontAwesomeIcon>
                  <Tooltip
                    id={`complete-trait-${props.collection.id}-${props.trait}-${set.owner}`}
                    style={{
                      backgroundColor: "#1F2937",
                      color: "white",
                      padding: "4px 8px",
                    }}
                  >
                    Complete <b>{props.trait}</b> trait set!
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </div>
      </summary>
      <div className={styles["collectorSetAccordionBody"]}>
        <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
          {props.values.length > 0 &&
            props.set.token_values?.map((tv) => (
              <div
                className="-tw-mx-3 tw-flex tw-flex-wrap tw-py-4"
                key={`accordion-${props.trait}-${tv.value}`}
              >
                <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-flex-wrap tw-items-center tw-gap-4 tw-px-3">
                  <span className="tw-flex tw-items-center tw-gap-4">
                    <FontAwesomeIcon
                      style={{ height: "1.5em", color: "#00aa00" }}
                      icon={faCheckCircle}
                    ></FontAwesomeIcon>
                    <b>
                      <Link
                        href={`/nextgen/collection/${formatNameForUrl(
                          props.collection.name
                        )}/art?traits=${props.trait}:${tv.value}`}
                        className="tw-no-underline hover:tw-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {tv.value}
                      </Link>
                    </b>
                  </span>
                  <span className="tw-flex tw-flex-wrap">
                    {tv.tokens.map((t) => (
                      <Link
                        key={`accordion-${props.trait}-${tv.value}-${t}`}
                        href={`/nextgen/token/${t}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <>
                          <Image
                            unoptimized
                            priority
                            loading="eager"
                            width={0}
                            height={0}
                            style={{
                              height: "50px",
                              width: "auto",
                              marginLeft: "5px",
                              marginRight: "5px",
                            }}
                            src={getNextGenIconUrl(t)}
                            alt={`#${t.toString()}`}
                            data-tooltip-id={`token-${t}`}
                            onError={({ currentTarget }) => {
                              if (currentTarget.src === getNextGenIconUrl(t)) {
                                currentTarget.src = getNextGenImageUrl(t);
                              }
                            }}
                          />
                          <Tooltip
                            id={`token-${t}`}
                            style={{
                              backgroundColor: "#1F2937",
                              color: "white",
                              padding: "4px 8px",
                            }}
                          >
                            {props.collection.name} #
                            {normalizeNextgenTokenID(t).token_id}
                          </Tooltip>
                        </>
                      </Link>
                    ))}
                  </span>
                </div>
              </div>
            ))}
          <div className="tw-pt-6 -tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              {missingValues.length > 0 ? (
                <>
                  Not Seized:{" "}
                  {missingValues.map((mv, index) => (
                    <Fragment key={mv}>
                      <Link
                        href={`/nextgen/collection/${formatNameForUrl(
                          props.collection.name
                        )}/art?traits=${props.trait}:${mv}`}
                        className="tw-no-underline hover:tw-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {mv}
                      </Link>
                      {index < missingValues.length - 1 ? ", " : ""}
                    </Fragment>
                  ))}
                </>
              ) : (
                <>
                  All values for <b>{props.trait}</b> trait Seized!
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
