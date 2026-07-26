"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  SOLIDITY_DECLARATION_MAX_QUERY_LENGTH,
  SOLIDITY_DECLARATION_PAGE_SIZE,
  type SolidityDeclarationSearchKind,
  type SolidityDeclarationSearchLocation,
  type SolidityGlobalDeclarationListItem,
} from "@/lib/public-review/solidityDeclarationSearchTypes";
import {
  fetchSolidityDeclarations,
  getSolidityDeclarationsQueryKey,
} from "@/services/api/public-review/declarations";

const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";

interface SolidityGlobalDeclarationExplorerProps {
  readonly linkMode: "active" | "versioned";
  readonly reviewId: string;
  readonly scopes: readonly string[];
  readonly sourceCommit: string;
  readonly version: string;
}

interface DeclarationFilters {
  readonly kind: SolidityDeclarationSearchKind;
  readonly location: SolidityDeclarationSearchLocation;
  readonly query: string;
  readonly scope: string;
}

export function SolidityGlobalDeclarationExplorer({
  linkMode,
  reviewId,
  scopes,
  sourceCommit,
  version,
}: SolidityGlobalDeclarationExplorerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<DeclarationFilters>({
    kind: "",
    location: "",
    query: "",
    scope: "",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({
        ...current,
        query: searchInput.trim(),
      }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const queryInput = {
    kind: filters.kind,
    linkMode,
    location: filters.location,
    query: filters.query,
    reviewId,
    scope: filters.scope,
    version,
  } as const;
  const declarationsQuery = useInfiniteQuery({
    queryKey: getSolidityDeclarationsQueryKey(queryInput),
    queryFn: ({ pageParam, signal }) =>
      fetchSolidityDeclarations({
        ...queryInput,
        limit: SOLIDITY_DECLARATION_PAGE_SIZE,
        offset: pageParam,
        signal,
        sourceCommit,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
  const visibleItems = useMemo(
    () => declarationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [declarationsQuery.data]
  );
  const total = declarationsQuery.data?.pages[0]?.total ?? 0;

  return (
    <section aria-labelledby="solidity-global-declarations">
      <h2
        id="solidity-global-declarations"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.globalDeclarations")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(
          DEFAULT_LOCALE,
          "publicReview.reference.globalDeclarationsDescription"
        )}
      </p>
      <div className="tw-mt-5 tw-grid tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200 sm:tw-col-span-2 xl:tw-col-span-1">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.searchAllDeclarations")}
          </span>
          <input
            className={INPUT_CLASSES}
            maxLength={SOLIDITY_DECLARATION_MAX_QUERY_LENGTH}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchAllDeclarationsPlaceholder"
            )}
            type="search"
            value={searchInput}
          />
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.filterDeclarationKind")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                kind: event.target.value as SolidityDeclarationSearchKind,
              }))
            }
            value={filters.kind}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            <option value="function">
              {t(DEFAULT_LOCALE, "publicReview.reference.functions")}
            </option>
            <option value="event">
              {t(DEFAULT_LOCALE, "publicReview.reference.events")}
            </option>
            <option value="error">
              {t(DEFAULT_LOCALE, "publicReview.reference.errors")}
            </option>
          </select>
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.filterScope")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                scope: event.target.value,
              }))
            }
            value={filters.scope}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            {scopes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.declarationLocation")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                location: event.target
                  .value as SolidityDeclarationSearchLocation,
              }))
            }
            value={filters.location}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            <option value="definition">
              {t(DEFAULT_LOCALE, "publicReview.reference.definitionScope")}
            </option>
            <option value="file-scope">
              {t(DEFAULT_LOCALE, "publicReview.reference.fileScope")}
            </option>
          </select>
        </label>
      </div>

      {declarationsQuery.isPending ? (
        <p
          className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400"
          role="status"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.loadingDeclarations")}
        </p>
      ) : null}
      {declarationsQuery.isError ? (
        <div
          className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-error/40 tw-bg-error/10 tw-p-4"
          role="alert"
        >
          <p className="tw-m-0 tw-text-sm tw-text-iron-100">
            {t(DEFAULT_LOCALE, "publicReview.reference.declarationsLoadError")}
          </p>
          <button
            className="tw-mt-3 tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
            onClick={() => void declarationsQuery.refetch()}
            type="button"
          >
            {t(DEFAULT_LOCALE, "publicReview.reference.retryDeclarations")}
          </button>
        </div>
      ) : null}
      {declarationsQuery.isSuccess ? (
        <p
          className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400"
          role="status"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.declarationResultsCount", {
            total: formatInteger(DEFAULT_LOCALE, total),
            visible: formatInteger(DEFAULT_LOCALE, visibleItems.length),
          })}
        </p>
      ) : null}

      {declarationsQuery.isSuccess && visibleItems.length === 0 ? (
        <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.reference.noDeclarations")}
        </p>
      ) : null}
      {visibleItems.length > 0 ? (
        <DeclarationResults items={visibleItems} />
      ) : null}
      {declarationsQuery.hasNextPage ? (
        <button
          className="tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white disabled:tw-cursor-wait disabled:tw-opacity-60"
          disabled={declarationsQuery.isFetchingNextPage}
          onClick={() => void declarationsQuery.fetchNextPage()}
          type="button"
        >
          {declarationsQuery.isFetchingNextPage
            ? t(
                DEFAULT_LOCALE,
                "publicReview.reference.loadingMoreDeclarations"
              )
            : t(DEFAULT_LOCALE, "publicReview.reference.showMoreDeclarations")}
        </button>
      ) : null}
    </section>
  );
}

function DeclarationResults({
  items,
}: {
  readonly items: readonly SolidityGlobalDeclarationListItem[];
}) {
  return (
    <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-space-y-2 tw-p-0">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            className="tw-grid tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-no-underline hover:tw-border-iron-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white lg:tw-grid-cols-[7rem_minmax(0,1fr)_minmax(13rem,auto)] lg:tw-items-center"
            href={item.href}
          >
            <span className="tw-flex tw-flex-wrap tw-gap-2">
              <span className="tw-w-fit tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-300">
                {item.kind}
              </span>
              {item.syntheticGetter ? (
                <span className="tw-w-fit tw-rounded-full tw-bg-sky-400/10 tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-semibold tw-text-sky-200">
                  {t(DEFAULT_LOCALE, "publicReview.reference.syntheticGetter")}
                </span>
              ) : null}
            </span>
            <span className="tw-min-w-0">
              <code className="tw-block tw-break-all tw-text-sm tw-text-white">
                {item.signature}
              </code>
              <span className="tw-mt-1 tw-block tw-break-all tw-font-mono tw-text-xs tw-text-iron-500">
                {item.definitionName
                  ? `${item.definitionName} · ${item.sourcePath}`
                  : item.sourcePath}
              </span>
            </span>
            <code className="tw-break-all tw-text-xs tw-text-sky-300 lg:tw-text-right">
              {item.selectorOrTopic}
            </code>
          </Link>
        </li>
      ))}
    </ul>
  );
}
