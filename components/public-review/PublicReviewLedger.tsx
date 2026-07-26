"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import {
  compareLocalized,
  formatDate,
  formatInteger,
  formatTime,
} from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getPublicReviewSourceLink } from "@/services/api/public-review/feedback-codec";
import {
  dedupePublicReviewLedgerRecords,
  fetchPublicReviewLedgerPage,
  filterPublicReviewLedgerRecords,
  getPublicReviewLedgerQueryKey,
  PUBLIC_REVIEW_LEDGER_PAGE_SIZE,
  type PublicReviewLedgerApi,
} from "@/services/api/public-review/ledger";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewLedgerFilters,
} from "@/services/api/public-review/types";

interface PublicReviewLedgerProps {
  readonly locale: SupportedLocale;
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly api?: PublicReviewLedgerApi | undefined;
  readonly pageSize?: number | undefined;
}

const EMPTY_FILTERS: PublicReviewLedgerFilters = {
  category: "",
  pageId: "",
  contract: "",
  severity: "",
  disposition: "",
  search: "",
};

const SELECT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";
const LEDGER_ALL_MESSAGE = "publicReview.ledger.all" as const;

export default function PublicReviewLedger({
  locale,
  config,
  destination,
  api,
  pageSize = PUBLIC_REVIEW_LEDGER_PAGE_SIZE,
}: PublicReviewLedgerProps) {
  const ledgerId = useId();
  const [filters, setFilters] =
    useState<PublicReviewLedgerFilters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const ledgerQuery = useInfiniteQuery({
    queryKey: getPublicReviewLedgerQueryKey({ config, destination }),
    queryFn: ({ pageParam, signal }) =>
      fetchPublicReviewLedgerPage({
        api,
        config,
        cursor: pageParam,
        destination,
        limit: pageSize,
        signal,
      }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const records = useMemo(
    () =>
      dedupePublicReviewLedgerRecords(
        ledgerQuery.data?.pages.flatMap((page) => page.records) ?? []
      ),
    [ledgerQuery.data]
  );
  const visibleRecords = useMemo(
    () => filterPublicReviewLedgerRecords({ records, filters }),
    [filters, records]
  );
  const warnings = useMemo(
    () => ledgerQuery.data?.pages.flatMap((page) => page.warnings) ?? [],
    [ledgerQuery.data]
  );
  const contracts = useMemo(
    () =>
      [
        ...new Set(
          records.flatMap((record) =>
            record.reference?.kind === "code" && record.reference.contract
              ? [record.reference.contract]
              : []
          )
        ),
      ].sort((left, right) => compareLocalized(locale, left, right)),
    [locale, records]
  );

  const setFilter = (
    field: keyof PublicReviewLedgerFilters,
    value: string
  ): void => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  return (
    <section
      aria-labelledby={`${ledgerId}-title`}
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-4 sm:tw-p-6"
    >
      <h2
        id={`${ledgerId}-title`}
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50"
      >
        {t(locale, "publicReview.ledger.title")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "publicReview.ledger.intro")}
      </p>

      <fieldset className="tw-mt-5 tw-grid tw-gap-4 tw-border-0 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
        <legend className="tw-sr-only">
          {t(locale, "publicReview.ledger.filters")}
        </legend>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(locale, "publicReview.ledger.search")}
          </span>
          <input
            type="search"
            className={SELECT_CLASSES}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <LedgerSelect
          label={t(locale, "publicReview.ledger.category")}
          allLabel={t(locale, LEDGER_ALL_MESSAGE)}
          options={config.categories}
          value={filters.category}
          onChange={(value) => setFilter("category", value)}
        />
        <LedgerSelect
          label={t(locale, "publicReview.ledger.page")}
          allLabel={t(locale, LEDGER_ALL_MESSAGE)}
          options={config.pages}
          value={filters.pageId}
          onChange={(value) => setFilter("pageId", value)}
        />
        <LedgerSelect
          label={t(locale, "publicReview.ledger.contract")}
          allLabel={t(locale, LEDGER_ALL_MESSAGE)}
          options={contracts.map((contract) => ({
            value: contract,
            label: contract,
          }))}
          value={filters.contract}
          onChange={(value) => setFilter("contract", value)}
        />
        <LedgerSelect
          label={t(locale, "publicReview.ledger.severity")}
          allLabel={t(locale, LEDGER_ALL_MESSAGE)}
          options={config.severityOptions}
          value={filters.severity}
          onChange={(value) => setFilter("severity", value)}
        />
        <LedgerSelect
          label={t(locale, "publicReview.ledger.disposition")}
          allLabel={t(locale, LEDGER_ALL_MESSAGE)}
          options={[
            {
              value: "NEW",
              label: t(locale, "publicReview.ledger.new"),
            },
          ]}
          value={filters.disposition}
          onChange={(value) => setFilter("disposition", value)}
        />
      </fieldset>

      <output
        className="tw-sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {ledgerQuery.isPending
          ? t(locale, "publicReview.ledger.loading")
          : t(locale, "publicReview.ledger.status", {
              count: formatInteger(locale, visibleRecords.length),
            })}
        {!ledgerQuery.isPending && warnings.length > 0
          ? ` ${t(locale, "publicReview.ledger.warning", {
              count: formatInteger(locale, warnings.length),
            })}`
          : ""}
      </output>

      {warnings.length > 0 ? (
        <p
          className="tw-mb-0 tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/40 tw-bg-amber-950/20 tw-p-3 tw-text-sm tw-text-amber-100"
        >
          {t(locale, "publicReview.ledger.warning", {
            count: formatInteger(locale, warnings.length),
          })}
        </p>
      ) : null}

      {ledgerQuery.isPending ? (
        <p className="tw-mb-0 tw-mt-6 tw-text-iron-300">
          {t(locale, "publicReview.ledger.loading")}
        </p>
      ) : null}
      {ledgerQuery.isError ? (
        <div
          className="tw-border-red-500/40 tw-bg-red-950/30 tw-mt-6 tw-rounded-lg tw-border tw-border-solid tw-p-4"
          role="alert"
        >
          <p className="tw-text-red-200 tw-m-0 tw-text-sm">
            {t(locale, "publicReview.ledger.loadError")}
          </p>
          <button
            type="button"
            onClick={() => void ledgerQuery.refetch()}
            className="tw-border-red-300/50 tw-text-red-100 focus-visible:tw-ring-red-300 tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold focus:tw-outline-none focus-visible:tw-ring-2"
          >
            {t(locale, "publicReview.ledger.retry")}
          </button>
        </div>
      ) : null}

      {!ledgerQuery.isPending &&
      !ledgerQuery.isError &&
      visibleRecords.length === 0 ? (
        <p className="tw-mb-0 tw-mt-6 tw-text-iron-300">
          {t(locale, "publicReview.ledger.empty")}
        </p>
      ) : null}

      {visibleRecords.length > 0 ? (
        <ol className="tw-mb-0 tw-mt-6 tw-list-none tw-space-y-4 tw-p-0">
          {visibleRecords.map((record) => {
            const author =
              record.author.handle ??
              t(locale, "publicReview.ledger.unknownAuthor");
            const pageLabel =
              config.pages.find((page) => page.value === record.pageId)
                ?.label ?? record.pageId;
            const categoryLabel =
              config.categories.find(
                (category) => category.value === record.category
              )?.label ?? record.category;
            const severityLabel =
              config.severityOptions.find(
                (severity) => severity.value === record.severity
              )?.label ?? record.severity;

            return (
              <li key={record.feedbackId}>
                <article
                  aria-label={t(locale, "publicReview.ledger.itemLabel", {
                    author,
                  })}
                  className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-p-4"
                >
                  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide">
                    <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-2.5 tw-py-1 tw-text-primary-300">
                      {categoryLabel}
                    </span>
                    <span className="tw-rounded-full tw-bg-iron-800 tw-px-2.5 tw-py-1 tw-text-iron-200">
                      {severityLabel}
                    </span>
                    <span className="tw-rounded-full tw-bg-iron-800 tw-px-2.5 tw-py-1 tw-text-iron-200">
                      {t(locale, "publicReview.ledger.new")}
                    </span>
                  </div>
                  <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-400">
                    {t(locale, "publicReview.ledger.byline", {
                      author,
                      page: pageLabel,
                      date: formatDate(locale, record.createdAt),
                      time: formatTime(locale, record.createdAt),
                    })}
                  </p>
                  <div className="tw-mb-0 tw-mt-4 tw-whitespace-pre-wrap tw-break-words tw-font-sans tw-text-sm tw-leading-6 tw-text-iron-200">
                    {record.body}
                  </div>
                  <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-text-sm">
                    <span className="tw-text-iron-400">
                      {t(locale, "publicReview.ledger.reactions", {
                        count: formatInteger(locale, record.reactionsCount),
                      })}
                    </span>
                    {record.reference?.kind === "code" ? (
                      <a
                        href={getPublicReviewSourceLink(record.reference)}
                        target="_blank"
                        rel="noreferrer"
                        className="tw-font-semibold tw-text-primary-300 tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
                      >
                        {t(locale, "publicReview.ledger.sourceReference")}
                      </a>
                    ) : null}
                    <Link
                      href={record.discussionPath}
                      className="tw-font-semibold tw-text-primary-300 tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
                    >
                      {t(locale, "publicReview.ledger.openDiscussion")}
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      ) : null}

      {ledgerQuery.hasNextPage ? (
        <button
          type="button"
          aria-busy={ledgerQuery.isFetchingNextPage}
          disabled={ledgerQuery.isFetchingNextPage}
          onClick={() => void ledgerQuery.fetchNextPage()}
          className="tw-mt-6 tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 disabled:tw-cursor-wait disabled:tw-opacity-60"
        >
          {ledgerQuery.isFetchingNextPage
            ? t(locale, "publicReview.ledger.loadingMore")
            : t(locale, "publicReview.ledger.loadMore")}
        </button>
      ) : null}
    </section>
  );
}

function LedgerSelect({
  allLabel,
  label,
  onChange,
  options,
  value,
}: {
  readonly allLabel: string;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  readonly value: string;
}) {
  return (
    <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
      <span className="tw-mb-1.5 tw-block">{label}</span>
      <select
        className={SELECT_CLASSES}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
