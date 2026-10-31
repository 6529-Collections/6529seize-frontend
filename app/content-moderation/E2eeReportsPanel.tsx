"use client";

import type { ApiE2eeTrustAndSafetyReport } from "@/generated/models/ApiE2eeTrustAndSafetyReport";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  type E2eeReportsCursor,
  fetchE2eeReports,
} from "@/services/api/e2ee-reports-api";
import { ENCRYPTED_REPORTS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatTimestamp } from "./content-moderation-page.helpers";
import E2eeReportDetail, {
  e2eeReportCategoryLabel,
  type E2eeReportAnnouncement,
} from "./E2eeReportDetail";

const NO_ANNOUNCEMENT: E2eeReportAnnouncement = { status: "", alert: "" };

const E2EE_REPORTS_PAGE_SIZE = 50;

const BADGE_CLASS =
  "tw-rounded-full tw-border tw-border-solid tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold";

function ReportRow({
  report,
  onReview,
  buttonRef,
}: {
  readonly report: ApiE2eeTrustAndSafetyReport;
  readonly onReview: () => void;
  readonly buttonRef: (element: HTMLButtonElement | null) => void;
}) {
  const locale = useBrowserLocale();
  const category = e2eeReportCategoryLabel(locale, report.category);
  const time = formatTimestamp(report.created_at, locale) ?? "";
  return (
    <li className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0 tw-space-y-2">
          <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
            {category}
          </p>
          <p className="tw-m-0 tw-text-sm tw-text-iron-400">
            {t(
              locale,
              "contentModeration.moderator.encryptedReports.reportedAt",
              {
                time,
              }
            )}
          </p>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <span
              className={`${BADGE_CLASS} ${
                report.verified
                  ? "tw-border-emerald-700 tw-text-emerald-300"
                  : "tw-border-amber-700 tw-text-amber-200"
              }`}
            >
              {t(
                locale,
                report.verified
                  ? "contentModeration.moderator.encryptedReports.verified"
                  : "contentModeration.moderator.encryptedReports.unverified"
              )}
            </span>
            <span
              className={`${BADGE_CLASS} tw-border-iron-700 tw-text-iron-200`}
            >
              {report.on_hold || report.expires_at === null
                ? t(
                    locale,
                    "contentModeration.moderator.encryptedReports.onHold"
                  )
                : t(
                    locale,
                    "contentModeration.moderator.encryptedReports.deletesOn",
                    { date: formatTimestamp(report.expires_at, locale) ?? "" }
                  )}
            </span>
          </div>
        </div>
        <button
          ref={buttonRef}
          type="button"
          onClick={onReview}
          aria-label={t(
            locale,
            "contentModeration.moderator.encryptedReports.reviewLabel",
            { category, time }
          )}
          className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(locale, "contentModeration.moderator.encryptedReports.review")}
        </button>
      </div>
    </li>
  );
}

/**
 * The "Encrypted reports" moderation tab: severe-harm reports from
 * end-to-end encrypted chats. The list shows no evidence; a report's
 * evidence is fetched (and logged by the server) only when a moderator opens
 * it.
 */
export default function E2eeReportsPanel({
  profileId,
}: {
  readonly profileId: string;
}) {
  const locale = useBrowserLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const [returnFocusTo, setReturnFocusTo] = useState<string | null>(null);
  const [detailAnnouncement, setDetailAnnouncement] =
    useState<E2eeReportAnnouncement>(NO_ANNOUNCEMENT);
  const reviewButtons = useRef(new Map<string, HTMLButtonElement>());
  const introRef = useRef<HTMLParagraphElement>(null);
  const query = useInfiniteQuery({
    queryKey: [...ENCRYPTED_REPORTS_QUERY_KEY, "list", profileId],
    queryFn: ({ pageParam, signal }) =>
      fetchE2eeReports({
        signal,
        limit: E2EE_REPORTS_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as E2eeReportsCursor | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.next_before !== null && lastPage.next_before_id !== null
        ? { before: lastPage.next_before, beforeId: lastPage.next_before_id }
        : undefined,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const reports = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  );

  useEffect(() => {
    if (selected === null && returnFocusTo !== null) {
      // If the opened report left the list, keep keyboard users oriented at
      // the top of the tab instead of dropping focus.
      (reviewButtons.current.get(returnFocusTo) ?? introRef.current)?.focus();
      setReturnFocusTo(null);
    }
  }, [selected, returnFocusTo]);

  const announceDetail = useCallback(
    (announcement: E2eeReportAnnouncement) =>
      setDetailAnnouncement(announcement),
    []
  );

  const listMode = selected === null;
  // A failure shows only once a retry settles, so a repeat is announced.
  const failed = query.isError && !query.isFetching;
  let listStatus = "";
  if (query.isLoading) {
    listStatus = t(
      locale,
      "contentModeration.moderator.encryptedReports.loading"
    );
  } else if (query.isSuccess && reports.length === 0) {
    listStatus = t(
      locale,
      "contentModeration.moderator.encryptedReports.empty"
    );
  }
  const listAlert = failed
    ? t(locale, "contentModeration.moderator.loadError")
    : "";
  const status = listMode ? listStatus : detailAnnouncement.status;
  const alert = listMode ? listAlert : detailAnnouncement.alert;

  return (
    <div className="tw-mt-6">
      {listMode ? (
        <p
          ref={introRef}
          tabIndex={-1}
          className="tw-m-0 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(locale, "contentModeration.moderator.encryptedReports.intro")}
        </p>
      ) : (
        <E2eeReportDetail
          key={selected}
          profileId={profileId}
          reportId={selected}
          onAnnounce={announceDetail}
          onBack={() => {
            setDetailAnnouncement(NO_ANNOUNCEMENT);
            setReturnFocusTo(selected);
            setSelected(null);
          }}
        />
      )}
      {/* Always mounted (empty when idle) in both views, so screen readers
          announce each change of text, including a repeated failure. */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="e2ee-reports-status"
        className={
          status ? "tw-mb-0 tw-mt-6 tw-text-sm tw-text-iron-400" : "tw-m-0"
        }
      >
        {status}
      </p>
      <p
        role="alert"
        aria-atomic="true"
        data-testid="e2ee-reports-alert"
        className={alert ? "tw-mb-0 tw-mt-6 tw-text-sm tw-text-red" : "tw-m-0"}
      >
        {alert}
      </p>
      {listMode && query.isError && (
        <button
          type="button"
          className="tw-mt-3 tw-min-h-11 tw-rounded-lg tw-bg-iron-900 tw-px-4 tw-text-iron-100 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {t(locale, "checks.retry")}
        </button>
      )}
      {listMode && reports.length > 0 && (
        <ul className="tw-m-0 tw-mt-6 tw-list-none tw-space-y-4 tw-p-0">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onReview={() => setSelected(report.id)}
              buttonRef={(element) => {
                if (element) {
                  reviewButtons.current.set(report.id, element);
                } else {
                  reviewButtons.current.delete(report.id);
                }
              }}
            />
          ))}
        </ul>
      )}
      {listMode && query.hasNextPage && (
        <div className="tw-flex tw-justify-center tw-pt-4">
          <button
            type="button"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
            className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50"
          >
            {t(
              locale,
              query.isFetchingNextPage
                ? "contentModeration.moderator.loadingMore"
                : "contentModeration.moderator.loadMore"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
