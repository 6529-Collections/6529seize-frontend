"use client";

import {
  faArrowCircleRight,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import type { SetStateAction } from "react";
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
import CollectEntryLink from "@/components/collect/CollectEntryLink";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
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

const fetchTraitValues = (endpoint: string) =>
  commonApiFetch<TraitValues[]>({ endpoint });
const fetchTraitSets = (endpoint: string) =>
  commonApiFetch<DBResponse<NextgenTraitSet>>({ endpoint });

function useTraitSetRequest<T>(
  endpoint: string | null,
  reload: number,
  fetchRequest: (endpoint: string) => Promise<T>
): { data: T | null; error: boolean; loaded: boolean } {
  const requestKey = `${endpoint ?? ""}:${reload}`;
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: boolean;
  } | null>(null);
  useEffect(() => {
    if (endpoint === null) return;
    let current = true;
    void fetchRequest(endpoint)
      .then((data) => {
        if (current) setResult({ key: requestKey, data, error: false });
      })
      .catch(() => {
        if (current) setResult({ key: requestKey, data: null, error: true });
      });
    return () => {
      current = false;
    };
  }, [endpoint, requestKey, fetchRequest]);
  return {
    data: result?.key === requestKey ? result.data : null,
    error: result?.key === requestKey && result.error,
    loaded: result?.key === requestKey,
  };
}

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
  const hasAvailableTraits = availableTraits.length > 0;

  const [requestedTrait, setRequestedTrait] = useState<string | null>(
    availableTraits[0] ?? null
  );
  const selectedTrait =
    requestedTrait === ULTIMATE ||
    availableTraits.includes(requestedTrait ?? "")
      ? requestedTrait
      : (availableTraits[0] ?? null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);
  const [reload, setReload] = useState(0);
  const traitRequest = useTraitSetRequest<TraitValues[]>(
    `nextgen/collections/${props.collection.id}/traits`,
    reload,
    fetchTraitValues
  );
  const traitsLoaded = traitRequest.loaded && !traitRequest.error;
  const selectedTraitValues =
    traitRequest.data?.find((trait) => trait.trait === selectedTrait)?.values ??
    [];
  const search =
    searchWallets.length > 0
      ? `&search=${encodeURIComponent(searchWallets.join(","))}`
      : "";
  const resultPath =
    selectedTrait === ULTIMATE
      ? `nextgen/collections/${props.collection.id}/ultimate_trait_set?trait=${availableTraits.join(",")}&page_size=${PAGE_SIZE}&page=${page}${search}`
      : `nextgen/collections/${props.collection.id}/trait_sets/${encodeURIComponent(selectedTrait ?? "")}?page_size=${PAGE_SIZE}&page=${page}${search}`;
  const setsRequest = useTraitSetRequest<DBResponse<NextgenTraitSet>>(
    traitsLoaded && selectedTrait !== null ? resultPath : null,
    reload,
    fetchTraitSets
  );
  const sets = setsRequest.data?.data ?? [];
  const totalResults = setsRequest.data?.count ?? 0;
  const setsLoaded = setsRequest.loaded;
  const loadError = traitRequest.error || setsRequest.error;

  function updateSearchWallets(wallets: SetStateAction<string[]>) {
    setSearchWallets(wallets);
    setPage(1);
  }

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
          setRequestedTrait(t);
          setPage(1);
        }}
      >
        {t}
      </button>
    );
  }

  function printUltimate() {
    if (loadError) return null;
    let content;
    if (!setsLoaded) {
      content = (
        <output
          aria-label="Loading ultimate trait sets"
          className="tw-flex tw-min-h-[40vh] tw-items-center tw-justify-center tw-gap-2 tw-py-8 tw-text-sm tw-text-iron-400"
        >
          Loading ultimate trait sets <DotLoader />
        </output>
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
            <UltimateOwner
              key={`ultimate-owner-${s.account_key ?? s.owner}`}
              set={s}
            />
          ))}
        </div>
      );
    }
    return <div className="tw-pt-5">{content}</div>;
  }

  function printTraitSetResults(selected: string) {
    if (loadError) return null;
    if (!setsLoaded) {
      return (
        <output
          aria-label="Loading trait sets"
          className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-8 tw-text-sm tw-text-iron-400"
        >
          Loading trait sets <DotLoader />
        </output>
      );
    }
    if (sets.length === 0) {
      return (
        <div className="tw-py-8 tw-text-sm tw-text-iron-400">
          No trait sets match the selected filters.
        </div>
      );
    }
    return sets.map((set) => (
      <TraitSetAccordion
        key={`collector-sets-${set.account_key ?? set.owner}`}
        collection={props.collection}
        trait={selected}
        set={set}
        values={selectedTraitValues}
      />
    ));
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
            setSearchWallets={updateSearchWallets}
            setShowSearchModal={setShowSearchModal}
          />
        )}
      </div>
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-400">
        {t(locale, "collect.sets.profileScope")}
      </p>
      {loadError && (
        <div
          role="alert"
          className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200"
        >
          {t(locale, "collect.error.analysis")}
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-4 tw-py-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "collect.retry")}
          </button>
        </div>
      )}
      <div className="tw-mt-5 tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-4">
        {availableTraits.map((trait) => printTraitPill(trait))}
        {hasAvailableTraits && printTraitPill(ULTIMATE)}
      </div>
      {props.collection.id === 1 && selectedTrait !== null && (
        <div className="tw-mt-4">
          <CollectEntryLink
            collection="pebbles"
            intent="pebbles_set"
            definitionId={selectedTrait}
            locale={locale}
            complete
          />
        </div>
      )}
      {!hasAvailableTraits && (
        <div className="tw-mt-5 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-900/50 tw-px-6 tw-py-12 tw-text-center">
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            No trait sets are configured for this collection.
          </p>
        </div>
      )}
      {!loadError && selectedTrait !== null && selectedTrait !== ULTIMATE && (
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
              <>
                {t(locale, "collect.sets.profiles", {
                  count: formatInteger(locale, totalResults),
                })}
              </>
            )}
          </span>
        </div>
      )}
      {selectedTrait === ULTIMATE && hasAvailableTraits && (
        <div className="tw-mt-5 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-4">
          <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white">
            {ULTIMATE} Set
          </h3>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-300">{`All ${availableTraits.join(", All ")} Types`}</p>
        </div>
      )}
      {selectedTrait !== null && selectedTrait !== ULTIMATE && (
        <div className="tw-min-h-[50vh] tw-pt-4">
          {printTraitSetResults(selectedTrait)}
        </div>
      )}
      {selectedTrait === ULTIMATE && hasAvailableTraits && printUltimate()}
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
          setSearchWallets={updateSearchWallets}
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
  const locale = useBrowserLocale();
  const set = props.set;
  const traitCounts: Record<string, number> = { ...set.trait_sets };
  if (!set.trait_sets) {
    for (const [key, value] of Object.entries(set)) {
      if (key.endsWith("_sets") && typeof value === "number") {
        traitCounts[key.replace("_sets", "")] = value;
      }
    }
  }
  const keys = Object.entries(traitCounts).map(([key, value]) => {
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
          <span key={`ultimate-owner-${set.account_key ?? set.owner}-${k.key}`}>
            {t(locale, "collect.sets.values", {
              trait: k.key,
              count: formatInteger(locale, Number(k.count)),
            })}
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
  const locale = useBrowserLocale();
  const set = props.set;

  const missingValues = props.values.filter(
    (v) => !set.token_values?.map((tv) => tv.value).includes(v)
  );

  return (
    <details className="tw-mb-2 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 open:tw-bg-iron-900">
      <summary className="tw-cursor-pointer tw-rounded-xl tw-p-4 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        <span className="tw-ml-2 tw-inline-flex tw-flex-wrap tw-items-center tw-gap-3">
          <b className="tw-text-base tw-font-semibold tw-text-white">
            {formatInteger(locale, set.distinct_values_count)}
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
                {tv.tokens.map((tokenId) => {
                  const custody = tv.token_owners?.find(
                    (owner) => owner.token_id === tokenId
                  )?.wallet;
                  const artwork = `${props.collection.name} #${normalizeNextgenTokenID(tokenId).token_id}`;
                  return (
                    <Link
                      key={`accordion-${props.trait}-${tv.value}-${tokenId}`}
                      href={`/nextgen/token/${tokenId}`}
                      aria-label={
                        custody
                          ? t(locale, "collect.sets.custody", {
                              artwork,
                              wallet: custody,
                            })
                          : artwork
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw-block tw-rounded-md focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    >
                      <>
                        <Image
                          unoptimized
                          width={50}
                          height={50}
                          className="tw-h-[50px] tw-w-auto tw-rounded-md tw-object-cover"
                          src={getNextGenIconUrl(tokenId)}
                          alt={`#${tokenId.toString()}`}
                          data-tooltip-id={`token-${tokenId}`}
                          onError={({ currentTarget }) => {
                            if (
                              currentTarget.src === getNextGenIconUrl(tokenId)
                            ) {
                              currentTarget.src = getNextGenImageUrl(tokenId);
                            }
                          }}
                        />
                        <Tooltip
                          id={`token-${tokenId}`}
                          className="!tw-bg-iron-800 !tw-px-2 !tw-py-1 !tw-text-white"
                        >
                          {custody
                            ? t(locale, "collect.sets.custody", {
                                artwork,
                                wallet: formatAddress(custody),
                              })
                            : artwork}
                        </Tooltip>
                      </>
                    </Link>
                  );
                })}
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
