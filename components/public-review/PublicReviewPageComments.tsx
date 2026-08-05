"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import { usePublicReviewCommentPanelOpen } from "@/components/public-review/PublicReviewReadingLayout";
import { formatDate, formatInteger, formatTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { PublicReviewSectionDefinition } from "@/lib/public-review/publicReviewTypes";
import {
  dedupePublicReviewLedgerRecords,
  fetchPublicReviewLedgerPage,
  getPublicReviewLedgerQueryKey,
  isPublicReviewRecordForPage,
  PUBLIC_REVIEW_LEDGER_PAGE_SIZE,
  type PublicReviewLedgerApi,
} from "@/services/api/public-review/ledger";
import { getPublicReviewFeedbackPrimaryComment } from "@/services/api/public-review/feedback-codec";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewPageContext,
  PublicReviewReferenceSelection,
} from "@/services/api/public-review/types";

export function PublicReviewPageComments({
  api,
  config,
  destination,
  locale,
  page,
  pageSize = PUBLIC_REVIEW_LEDGER_PAGE_SIZE,
  referenceSelection,
  sections,
}: {
  readonly api?: PublicReviewLedgerApi | undefined;
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly locale: SupportedLocale;
  readonly page: PublicReviewPageContext;
  readonly pageSize?: number | undefined;
  readonly referenceSelection?: PublicReviewReferenceSelection | undefined;
  readonly sections: readonly PublicReviewSectionDefinition[];
}) {
  const isPanelOpen = usePublicReviewCommentPanelOpen();
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
    enabled: isPanelOpen,
  });
  const records = useMemo(
    () =>
      dedupePublicReviewLedgerRecords(
        ledgerQuery.data?.pages.flatMap((ledgerPage) => ledgerPage.records) ??
          []
      ).filter((record) =>
        isPublicReviewRecordForPage({ page, record, referenceSelection })
      ),
    [ledgerQuery.data, page, referenceSelection]
  );
  return (
    <section aria-label={t(locale, "publicReview.comments.title")}>
      <output className="tw-sr-only" aria-live="polite" aria-atomic="true">
        {ledgerQuery.isLoading
          ? t(locale, "publicReview.comments.loading")
          : t(locale, "publicReview.comments.status", {
              count: formatInteger(locale, records.length),
            })}
      </output>

      {ledgerQuery.isLoading ? (
        <div aria-hidden="true" className="tw-mt-4 tw-space-y-2 tw-py-3">
          <div className="tw-h-3 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-iron-800 motion-reduce:tw-animate-none" />
          <div className="tw-h-3 tw-w-full tw-animate-pulse tw-rounded tw-bg-iron-800 motion-reduce:tw-animate-none" />
          <div className="tw-h-3 tw-w-4/5 tw-animate-pulse tw-rounded tw-bg-iron-800 motion-reduce:tw-animate-none" />
          <span className="tw-sr-only">
            {t(locale, "publicReview.comments.loading")}
          </span>
        </div>
      ) : null}

      {ledgerQuery.isError ? (
        <div
          className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/[0.06] tw-px-3 tw-py-2.5"
          role="alert"
        >
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300">
            {t(locale, "publicReview.comments.loadError")}
          </p>
          <button
            type="button"
            onClick={() => void ledgerQuery.refetch()}
            className="hover:tw-text-primary-200 tw-mt-1 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0 tw-pr-2 tw-text-xs tw-font-medium tw-text-primary-300 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          >
            <ArrowPathIcon
              className="tw-size-3.5 tw-flex-none"
              aria-hidden="true"
            />
            {t(locale, "publicReview.ledger.retry")}
          </button>
        </div>
      ) : null}

      {!ledgerQuery.isLoading &&
      !ledgerQuery.isError &&
      records.length === 0 ? (
        <p className="tw-mb-0 tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.12] tw-bg-iron-900/70 tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            locale,
            ledgerQuery.hasNextPage
              ? "publicReview.comments.emptyLoaded"
              : "publicReview.comments.empty"
          )}
        </p>
      ) : null}

      {records.length > 0 ? (
        <ol className="tw-mb-0 tw-mt-3 tw-list-none tw-space-y-3 tw-p-0">
          {records.map((record) => {
            const author =
              record.author.handle ??
              t(locale, "publicReview.ledger.unknownAuthor");
            const categoryLabel =
              config.categories.find(
                (category) => category.value === record.category
              )?.label ?? record.category;
            const severityLabel =
              config.severityOptions.find(
                (severity) => severity.value === record.severity
              )?.label ?? record.severity;
            const primaryComment = getPublicReviewFeedbackPrimaryComment(
              record.body
            );
            const sectionLabel = record.sectionId
              ? (sections.find((section) => section.id === record.sectionId)
                  ?.title ?? record.sectionId)
              : undefined;

            return (
              <li key={record.dropId}>
                <article
                  aria-label={t(locale, "publicReview.ledger.itemLabel", {
                    author,
                  })}
                  className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.12] tw-bg-iron-900/70 tw-p-3 tw-shadow-sm tw-shadow-black/20"
                >
                  <div className="tw-flex tw-items-start tw-gap-2.5">
                    <ProfileAvatar
                      pfpUrl={record.author.pfp}
                      size={ProfileBadgeSize.SMALL}
                      alt={t(locale, "publicReview.comments.avatarAlt", {
                        author,
                      })}
                      fallbackContent={
                        <span
                          aria-hidden="true"
                          className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-300"
                        >
                          {author.slice(0, 1)}
                        </span>
                      }
                    />
                    <div className="tw-min-w-0 tw-flex-1">
                      <div className="tw-flex tw-items-center tw-gap-1.5">
                        <p className="tw-m-0 tw-min-w-0 tw-text-[0.68rem] tw-leading-4 tw-text-iron-400">
                          {t(locale, "publicReview.comments.byline", {
                            author,
                            date: formatDate(locale, record.createdAt),
                            time: formatTime(locale, record.createdAt),
                          })}
                        </p>
                      </div>
                      {sectionLabel ? (
                        <p className="tw-mb-0 tw-mt-2 tw-text-[0.68rem] tw-font-medium tw-leading-4 tw-text-iron-300">
                          {t(locale, "publicReview.feedback.sectionContext", {
                            section: sectionLabel,
                          })}
                        </p>
                      ) : null}
                      <p className="tw-mb-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200">
                        {primaryComment || record.body}
                      </p>
                      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-text-[0.61rem] tw-font-semibold tw-uppercase tw-tracking-[0.1em]">
                        <span className="tw-text-sky-300">{categoryLabel}</span>
                        <span aria-hidden="true" className="tw-text-iron-700">
                          ·
                        </span>
                        <span className="tw-text-iron-400">
                          {severityLabel}
                        </span>
                      </div>
                      <Link
                        href={record.discussionPath}
                        className="hover:tw-text-primary-200 tw-mt-1 tw-inline-flex tw-min-h-11 tw-items-center tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-decoration-primary-400/40 tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                      >
                        {t(locale, "publicReview.ledger.openDiscussion")}
                      </Link>
                    </div>
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
          className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-border-white/20 hover:tw-bg-white/[0.025] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white disabled:tw-cursor-wait disabled:tw-opacity-60"
        >
          {t(
            locale,
            ledgerQuery.isFetchingNextPage
              ? "publicReview.ledger.loadingMore"
              : "publicReview.ledger.loadMore"
          )}
        </button>
      ) : null}
    </section>
  );
}
