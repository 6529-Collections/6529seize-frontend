"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import {
  PUBLIC_REVIEW_INPUT_CLASSES,
  PublicReviewSelect,
} from "@/components/public-review/PublicReviewFormControls";
import type { SupportedLocale } from "@/i18n/locales";
import {
  compareLocalized,
  formatDate,
  formatInteger,
  formatTime,
} from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  createPublicReviewLedgerCsv,
  createPublicReviewLedgerMarkdown,
} from "@/lib/public-review/publicReviewLedgerExport";
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
  PublicReviewFeedbackRecord,
  PublicReviewLedgerFilters,
} from "@/services/api/public-review/types";

interface PublicReviewLedgerProps {
  readonly locale: SupportedLocale;
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly internalSourceBasePath?: string | undefined;
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

const LEDGER_ALL_MESSAGE = "publicReview.ledger.all" as const;

function getInternalSourceLink({
  basePath,
  record,
}: {
  readonly basePath: string;
  readonly record: PublicReviewFeedbackRecord;
}): string | undefined {
  const reference =
    record.reference?.kind === "code" ? record.reference : undefined;
  if (
    !reference ||
    !basePath.startsWith("/reviews/") ||
    basePath.includes("..")
  ) {
    return undefined;
  }
  const sourcePath = reference.path
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  const lineFragment =
    reference.lineStart === reference.lineEnd
      ? `#L${reference.lineStart}`
      : `#L${reference.lineStart}-L${reference.lineEnd}`;
  return `${basePath}/versions/${encodeURIComponent(
    record.reviewVersion
  )}/reference/sources/${sourcePath}${lineFragment}`;
}

function downloadLedgerExport({
  content,
  filename,
  type,
}: {
  readonly content: string;
  readonly filename: string;
  readonly type: string;
}): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

export default function PublicReviewLedger({
  locale,
  config,
  destination,
  internalSourceBasePath,
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
    queryKey: getPublicReviewLedgerQueryKey({
      config,
      destination,
      pageSize,
    }),
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
  const exportUnavailable =
    visibleRecords.length === 0 || Boolean(ledgerQuery.hasNextPage);

  const setFilter = (
    field: keyof PublicReviewLedgerFilters,
    value: string
  ): void => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  return (
    <section
      aria-labelledby={`${ledgerId}-title`}
      className="tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-py-8"
    >
      <h2
        id={`${ledgerId}-title`}
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
      >
        {t(locale, "publicReview.ledger.title")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-pretty tw-text-sm tw-font-light tw-leading-6 tw-text-iron-300">
        {t(locale, "publicReview.ledger.intro")}
      </p>
      <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-2">
        <button
          type="button"
          aria-describedby={
            ledgerQuery.hasNextPage ? `${ledgerId}-export-status` : undefined
          }
          disabled={exportUnavailable}
          onClick={() =>
            downloadLedgerExport({
              content: createPublicReviewLedgerCsv(visibleRecords),
              filename: `${config.reviewId}-${config.reviewVersion}-feedback.csv`,
              type: "text/csv;charset=utf-8",
            })
          }
          className="tw-inline-flex tw-min-h-9 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-white/[0.08] tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-colors hover:tw-border-white/[0.15] hover:tw-bg-white/[0.02] hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 disabled:hover:tw-border-white/[0.08] disabled:hover:tw-bg-transparent disabled:hover:tw-text-iron-300"
        >
          {t(locale, "publicReview.ledger.exportCsv")}
        </button>
        <button
          type="button"
          aria-describedby={
            ledgerQuery.hasNextPage ? `${ledgerId}-export-status` : undefined
          }
          disabled={exportUnavailable}
          onClick={() =>
            downloadLedgerExport({
              content: createPublicReviewLedgerMarkdown(
                visibleRecords,
                config.reviewTitle
              ),
              filename: `${config.reviewId}-${config.reviewVersion}-feedback.md`,
              type: "text/markdown;charset=utf-8",
            })
          }
          className="tw-inline-flex tw-min-h-9 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-white/[0.08] tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-colors hover:tw-border-white/[0.15] hover:tw-bg-white/[0.02] hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 disabled:hover:tw-border-white/[0.08] disabled:hover:tw-bg-transparent disabled:hover:tw-text-iron-300"
        >
          {t(locale, "publicReview.ledger.exportMarkdown")}
        </button>
      </div>
      {ledgerQuery.hasNextPage ? (
        <p
          className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400"
          id={`${ledgerId}-export-status`}
        >
          {t(locale, "publicReview.ledger.exportRequiresCompleteLedger")}
        </p>
      ) : null}

      <fieldset className="tw-mt-6 tw-grid tw-gap-x-4 tw-gap-y-5 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-6 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03] sm:tw-grid-cols-2 lg:tw-grid-cols-3">
        <legend className="tw-sr-only">
          {t(locale, "publicReview.ledger.filters")}
        </legend>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(locale, "publicReview.ledger.search")}
          </span>
          <input
            type="search"
            className={PUBLIC_REVIEW_INPUT_CLASSES}
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

      <output className="tw-sr-only" aria-live="polite" aria-atomic="true">
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
        <p className="tw-mb-0 tw-mt-5 tw-rounded-md tw-border tw-border-solid tw-border-[#5c4d3c] tw-bg-[#b48232]/[0.015] tw-p-4 tw-text-[13.5px] tw-font-light tw-leading-relaxed tw-text-[#c2b29e]">
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
        <ol className="tw-mb-0 tw-mt-8 tw-list-none tw-divide-y tw-divide-white/[0.05] tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03]">
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
            const internalSourceLink = internalSourceBasePath
              ? getInternalSourceLink({
                  basePath: internalSourceBasePath,
                  record,
                })
              : undefined;

            return (
              <li
                key={record.dropId}
                className="tw-py-8 first:tw-pt-0 last:tw-pb-0"
              >
                <article
                  aria-label={t(locale, "publicReview.ledger.itemLabel", {
                    author,
                  })}
                  className="tw-min-w-0"
                >
                  <div className="tw-mb-1 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.1em]">
                    <span className="tw-text-sky-300">{categoryLabel}</span>
                    <span aria-hidden="true" className="tw-text-iron-800">
                      ·
                    </span>
                    <span className="tw-text-iron-500">{severityLabel}</span>
                    <span aria-hidden="true" className="tw-text-iron-800">
                      ·
                    </span>
                    <span className="tw-text-iron-500">
                      {t(locale, "publicReview.ledger.new")}
                    </span>
                  </div>
                  <p className="tw-mb-0 tw-mt-2 tw-text-pretty tw-text-xs tw-font-light tw-leading-5 tw-text-iron-500">
                    {t(locale, "publicReview.ledger.byline", {
                      author,
                      page: pageLabel,
                      date: formatDate(locale, record.createdAt),
                      time: formatTime(locale, record.createdAt),
                    })}
                  </p>
                  <div className="tw-mb-0 tw-mt-4 tw-whitespace-pre-wrap tw-break-words tw-font-sans tw-text-sm tw-font-normal tw-leading-[1.8] tw-text-iron-300">
                    {record.body}
                  </div>
                  <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 tw-text-[13px]">
                    <span className="tw-text-iron-500">
                      {t(locale, "publicReview.ledger.reactions", {
                        count: formatInteger(locale, record.reactionsCount),
                      })}
                    </span>
                    {record.reference?.kind === "code" ? (
                      <>
                        {internalSourceLink ? (
                          <Link
                            href={internalSourceLink}
                            className="tw-font-normal tw-text-primary-300 tw-no-underline hover:tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
                          >
                            {t(
                              locale,
                              "publicReview.ledger.internalSourceReference"
                            )}
                          </Link>
                        ) : null}
                        <a
                          href={getPublicReviewSourceLink(record.reference)}
                          target="_blank"
                          rel="noreferrer"
                          className="tw-font-normal tw-text-primary-300 tw-no-underline hover:tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
                        >
                          {t(
                            locale,
                            "publicReview.ledger.githubSourceReference"
                          )}
                        </a>
                      </>
                    ) : null}
                    <Link
                      href={record.discussionPath}
                      className="tw-font-normal tw-text-primary-300 tw-no-underline hover:tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
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
          className="tw-mt-6 tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 disabled:tw-cursor-wait disabled:tw-opacity-60"
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
      <PublicReviewSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </PublicReviewSelect>
    </label>
  );
}
