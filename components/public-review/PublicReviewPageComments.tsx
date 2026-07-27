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
import {
  dedupePublicReviewLedgerRecords,
  fetchPublicReviewLedgerPage,
  getPublicReviewLedgerQueryKey,
  PUBLIC_REVIEW_LEDGER_PAGE_SIZE,
  type PublicReviewLedgerApi,
} from "@/services/api/public-review/ledger";
import { getPublicReviewFeedbackPrimaryComment } from "@/services/api/public-review/feedback-codec";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewPageContext,
} from "@/services/api/public-review/types";

export function PublicReviewPageComments({
  api,
  config,
  destination,
  locale,
  page,
  pageSize = PUBLIC_REVIEW_LEDGER_PAGE_SIZE,
}: {
  readonly api?: PublicReviewLedgerApi | undefined;
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly locale: SupportedLocale;
  readonly page: PublicReviewPageContext;
  readonly pageSize?: number | undefined;
}) {
  const isPanelOpen = usePublicReviewCommentPanelOpen();
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
    enabled: isPanelOpen,
  });
  const records = useMemo(
    () =>
      dedupePublicReviewLedgerRecords(
        ledgerQuery.data?.pages.flatMap((ledgerPage) => ledgerPage.records) ??
          []
      ).filter((record) => record.pageId === page.pageId),
    [ledgerQuery.data, page.pageId]
  );
  const warnings = useMemo(
    () =>
      ledgerQuery.data?.pages.flatMap((ledgerPage) => ledgerPage.warnings) ??
      [],
    [ledgerQuery.data]
  );

  return (
    <section aria-label={t(locale, "publicReview.comments.title")}>
      <output className="tw-sr-only" aria-live="polite" aria-atomic="true">
        {ledgerQuery.isPending
          ? t(locale, "publicReview.comments.loading")
          : t(locale, "publicReview.comments.status", {
              count: formatInteger(locale, records.length),
            })}
      </output>

      {warnings.length > 0 ? (
        <p className="tw-mb-0 tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/30 tw-bg-amber-950/20 tw-p-3 tw-text-xs tw-leading-5 tw-text-amber-100">
          {t(locale, "publicReview.ledger.warning", {
            count: formatInteger(locale, warnings.length),
          })}
        </p>
      ) : null}

      {ledgerQuery.isPending ? (
        <div aria-hidden="true" className="tw-mt-4 tw-space-y-2 tw-py-3">
          <div className="tw-h-3 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-iron-800" />
          <div className="tw-h-3 tw-w-full tw-animate-pulse tw-rounded tw-bg-iron-800" />
          <div className="tw-h-3 tw-w-4/5 tw-animate-pulse tw-rounded tw-bg-iron-800" />
          <span className="tw-sr-only">
            {t(locale, "publicReview.comments.loading")}
          </span>
        </div>
      ) : null}

      {ledgerQuery.isError ? (
        <div
          className="tw-mt-3 tw-rounded-lg tw-bg-primary-400/[0.025] tw-px-3 tw-py-2.5"
          role="alert"
        >
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
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

      {!ledgerQuery.isPending &&
      !ledgerQuery.isError &&
      records.length === 0 ? (
        <p className="tw-mb-0 tw-mt-4 tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-py-5 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(
            locale,
            ledgerQuery.hasNextPage
              ? "publicReview.comments.emptyLoaded"
              : "publicReview.comments.empty"
          )}
        </p>
      ) : null}

      {records.length > 0 ? (
        <ol className="tw-mb-0 tw-mt-3 tw-list-none tw-divide-y tw-divide-white/[0.08] tw-p-0">
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

            return (
              <li key={record.dropId}>
                <article
                  aria-label={t(locale, "publicReview.ledger.itemLabel", {
                    author,
                  })}
                  className="tw-py-4"
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
                          className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400"
                        >
                          {author.slice(0, 1)}
                        </span>
                      }
                    />
                    <div className="tw-min-w-0 tw-flex-1">
                      <div className="tw-flex tw-items-center tw-gap-1.5">
                        <p className="tw-m-0 tw-min-w-0 tw-text-[0.68rem] tw-leading-4 tw-text-iron-500">
                          {t(locale, "publicReview.comments.byline", {
                            author,
                            date: formatDate(locale, record.createdAt),
                            time: formatTime(locale, record.createdAt),
                          })}
                        </p>
                      </div>
                      <p className="tw-mb-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200">
                        {primaryComment || record.body}
                      </p>
                      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-text-[0.61rem] tw-font-semibold tw-uppercase tw-tracking-[0.1em]">
                        <span className="tw-text-sky-300">
                          {categoryLabel}
                        </span>
                        <span aria-hidden="true" className="tw-text-iron-700">
                          ·
                        </span>
                        <span className="tw-text-iron-500">
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
