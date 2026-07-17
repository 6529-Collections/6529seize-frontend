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
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import {
  getNextGenIconUrl,
  getNextGenImageUrl,
} from "../nextgenToken/NextGenTokenImage";
import NextGenCollectionHeader, {
  NextGenBackToCollectionPageLink,
} from "./NextGenCollectionHeader";

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
  const locale = useBrowserLocale();
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
    const isSelected = t === selectedTrait;

    return (
      <button
        key={t}
        type="button"
        aria-pressed={isSelected}
        className={`tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-transition focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
          isSelected
            ? "tw-border-white tw-bg-white tw-text-iron-950"
            : "tw-border-white/10 tw-bg-iron-900 tw-text-iron-200 hover:tw-border-white/20 hover:tw-bg-iron-800 hover:tw-text-white"
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
    );
  }

  function printUltimate() {
    let content;
    if (!setsLoaded) {
      content = (
        <div
          role="status"
          className="tw-flex tw-min-h-[40vh] tw-items-center tw-justify-center tw-gap-2 tw-py-8 tw-text-sm tw-text-iron-400"
        >
          Loading ultimate trait sets <DotLoader />
        </div>
      );
    } else if (totalResults == 0) {
      content = (
        <div className="tw-flex tw-min-h-[50vh] tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-6">
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">None!</p>
          <div>
            <Image
              unoptimized
              priority
              loading="eager"
              width={1200}
              height={1200}
              className="tw-h-auto tw-max-h-[60vh] tw-w-auto tw-max-w-full tw-object-contain"
              src="/nextgen/none-ultimate.jpeg"
              alt="None Balloon"
            />
          </div>
        </div>
      );
    } else {
      content = (
        <div className="tw-min-h-[50vh] tw-space-y-2">
          {sets.map((s) => (
            <UltimateOwner key={`ultimate-owner-${s.owner}`} set={s} />
          ))}
        </div>
      );
    }
    return <div className="tw-pt-5">{content}</div>;
  }

  return (
    <div
      className={
        props.preview
          ? "tw-w-full"
          : "tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-12 md:tw-px-6 lg:tw-px-8"
      }
    >
      {!props.preview && (
        <section className="tw-py-6 sm:tw-py-8">
          <NextGenBackToCollectionPageLink collection={props.collection} />
          <div className="tw-mt-2">
            <NextGenCollectionHeader
              collection={props.collection}
              contained={false}
              compact={true}
              show_links={true}
            />
          </div>
        </section>
      )}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
        <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl">
          Trait Sets
        </h2>
        {props.preview && (
          <Link
            href={`/nextgen/collection/${formatNameForUrl(
              props.collection.name
            )}/trait-sets`}
            className="tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition hover:tw-bg-white/5 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            View All
            <FontAwesomeIcon
              icon={faArrowCircleRight}
              className="tw-h-5 tw-w-5"
              aria-hidden="true"
            />
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
      <div className="tw-mt-5 tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-4">
        {availableTraits.map((trait) => printTraitPill(trait))}
        {printTraitPill(ULTIMATE)}
      </div>
      {selectedTrait !== ULTIMATE && (
        <div className="tw-mt-5 tw-flex tw-flex-col tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <span className="tw-text-sm tw-text-iron-300">
            {traitsLoaded ? (
              <>
                Unique values for <b>{selectedTrait}</b> trait: x
                {formatInteger(locale, selectedTraitValues.length)}
              </>
            ) : (
              <DotLoader />
            )}
          </span>
          <span className="tw-text-sm tw-text-iron-300">
            {!setsLoaded ? (
              <DotLoader />
            ) : (
              <>Collectors Count: {formatInteger(locale, totalResults)}</>
            )}
          </span>
        </div>
      )}
      {selectedTrait === ULTIMATE && (
        <div className="tw-mt-5 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-4">
          <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white">
            {ULTIMATE} Set
          </h3>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-300">{`All ${availableTraits.join(", All ")} Types`}</p>
        </div>
      )}
      {selectedTrait !== ULTIMATE && (
        <div className="tw-min-h-[50vh] tw-pt-4">
          {!setsLoaded ? (
            <div
              role="status"
              className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-8 tw-text-sm tw-text-iron-400"
            >
              Loading trait sets <DotLoader />
            </div>
          ) : sets.length === 0 ? (
            <div className="tw-py-8 tw-text-sm tw-text-iron-400">
              No trait sets match the selected filters.
            </div>
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
      )}
      {selectedTrait === ULTIMATE && printUltimate()}
      {!props.preview &&
        totalResults > 0 &&
        totalResults / PAGE_SIZE > 1 &&
        setsLoaded && (
          <div className="tw-flex tw-justify-center tw-pb-4 tw-pt-6 tw-text-center">
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
          <div className="tw-flex tw-justify-center tw-pt-5">
            <Link
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/trait-sets`}
              className="tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition hover:tw-bg-white/5 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              View All Trait Sets
              <FontAwesomeIcon
                icon={faArrowCircleRight}
                className="tw-h-5 tw-w-5"
                aria-hidden="true"
              />
            </Link>
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
    <article className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
      <Owner set={set} />
      <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-2 tw-text-sm tw-text-iron-300">
        {keys.map((k) => (
          <span key={`ultimate-owner-${set.owner}-${k.key}`}>
            <b className="tw-font-semibold tw-text-white">{k.key}</b> Sets:{" "}
            {String(k.count)}
          </span>
        ))}
      </div>
    </article>
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
      className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-text-iron-100 tw-no-underline hover:tw-text-white hover:tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
    <details className="tw-mb-2 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 open:tw-bg-iron-900">
      <summary className="tw-cursor-pointer tw-rounded-xl tw-p-4 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        <span className="tw-ml-2 tw-inline-flex tw-flex-wrap tw-items-center tw-gap-3">
          <b className="tw-text-base tw-font-semibold tw-text-white">
            {set.distinct_values_count}
          </b>
          <span className="tw-text-iron-500">—</span>
          <Owner set={set} />
          {props.values.length > 0 && missingValues.length === 0 && (
            <>
              <FontAwesomeIcon
                className="tw-h-6 tw-text-success"
                icon={faCheckCircle}
                data-tooltip-id={`complete-trait-${props.collection.id}-${props.trait}-${set.owner}`}
                aria-hidden="true"
              />
              <Tooltip
                id={`complete-trait-${props.collection.id}-${props.trait}-${set.owner}`}
                className="!tw-bg-iron-800 !tw-px-2 !tw-py-1 !tw-text-white"
              >
                Complete <b>{props.trait}</b> trait set!
              </Tooltip>
            </>
          )}
        </span>
      </summary>
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-p-4 sm:tw-p-5">
        {props.values.length > 0 &&
          props.set.token_values.map((tv) => (
            <div
              className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-border-0 tw-border-b tw-border-solid tw-border-white/5 tw-py-4 last:tw-border-b-0"
              key={`accordion-${props.trait}-${tv.value}`}
            >
              <span className="tw-flex tw-items-center tw-gap-3">
                <FontAwesomeIcon
                  className="tw-h-6 tw-text-success"
                  icon={faCheckCircle}
                  aria-hidden="true"
                />
                <b>
                  <Link
                    href={`/nextgen/collection/${formatNameForUrl(
                      props.collection.name
                    )}/art?traits=${props.trait}:${tv.value}`}
                    className="tw-rounded-md tw-text-white tw-no-underline hover:tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {tv.value}
                  </Link>
                </b>
              </span>
              <span className="tw-flex tw-flex-wrap tw-gap-2">
                {tv.tokens.map((t) => (
                  <Link
                    key={`accordion-${props.trait}-${tv.value}-${t}`}
                    href={`/nextgen/token/${t}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw-block tw-rounded-md focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    <>
                      <Image
                        unoptimized
                        priority
                        loading="eager"
                        width={50}
                        height={50}
                        className="tw-h-[50px] tw-w-auto tw-rounded-md tw-object-cover"
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
                        className="!tw-bg-iron-800 !tw-px-2 !tw-py-1 !tw-text-white"
                      >
                        {props.collection.name} #
                        {normalizeNextgenTokenID(t).token_id}
                      </Tooltip>
                    </>
                  </Link>
                ))}
              </span>
            </div>
          ))}
        <div className="tw-pt-5 tw-text-sm tw-leading-6 tw-text-iron-300">
          {missingValues.length > 0 ? (
            <>
              Not Seized:{" "}
              {missingValues.map((mv, index) => (
                <Fragment key={mv}>
                  <Link
                    href={`/nextgen/collection/${formatNameForUrl(
                      props.collection.name
                    )}/art?traits=${props.trait}:${mv}`}
                    className="tw-rounded-md tw-text-white tw-no-underline hover:tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
    </details>
  );
}
