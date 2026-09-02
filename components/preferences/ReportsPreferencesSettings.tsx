"use client";

import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import ReportedContentPreview from "@/components/preferences/ReportedContentPreview";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import type { ApiContentModerationUserReport } from "@/generated/models/ApiContentModerationUserReport";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  fetchMyContentModerationReports,
  withdrawDropReport,
} from "@/services/api/content-moderation-api";
import {
  invalidateContentModerationPresentation,
  MY_CONTENT_MODERATION_REPORTS_QUERY_KEY,
} from "@/services/content-moderation/content-moderation-query";
import { useAuth } from "@/components/auth/Auth";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const PAGE_SIZE = 50;

const getReportStatusLabel = (
  report: ApiContentModerationUserReport,
  locale: ReturnType<typeof useBrowserLocale>
): string => {
  switch (report.status) {
    case ApiContentModerationReportStatus.Open:
      return t(locale, "contentModeration.report.awaitingReview");
    case ApiContentModerationReportStatus.ResolvedRemoved:
      return t(locale, "contentModeration.report.contentRemoved");
    case ApiContentModerationReportStatus.Withdrawn:
      return t(locale, "contentModeration.preferences.reports.withdrawn");
    case ApiContentModerationReportStatus.ResolvedAllowed:
      return t(locale, "contentModeration.report.noActionTaken");
  }
};

function ReportRow({
  report,
}: {
  readonly report: ApiContentModerationUserReport;
}) {
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useAuth();
  const queryClient = useQueryClient();
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const profileLabel = report.author_handle ?? report.author_profile_id;
  const mutation = useMutation({
    mutationFn: async () => {
      const { success } = await requestAuth();
      if (!success) {
        throw new Error("Authentication was cancelled");
      }
      return withdrawDropReport(report.drop_id);
    },
    onSuccess: async () => {
      setConfirmWithdraw(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: MY_CONTENT_MODERATION_REPORTS_QUERY_KEY,
        }),
        invalidateContentModerationPresentation(queryClient),
      ]);
    },
    onError: (error) => {
      if (
        error instanceof Error &&
        error.message === "Authentication was cancelled"
      ) {
        return;
      }
      setToast({
        type: "error",
        title: t(locale, "contentModeration.report.withdrawError"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
  });

  return (
    <li className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 last:tw-border-b-0">
      <div className="tw-flex tw-items-start tw-gap-3">
        <Link
          href={`/${encodeURIComponent(profileLabel)}`}
          aria-label={t(locale, "contentModeration.preferences.openProfile", {
            profile: profileLabel,
          })}
          className="tw-relative tw-size-10 tw-flex-none tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {report.author_pfp && (
            <Image
              src={resolveIpfsUrlSync(report.author_pfp)}
              alt=""
              fill
              sizes="40px"
              className="tw-object-cover"
            />
          )}
        </Link>
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
            <Link
              href={`/${encodeURIComponent(profileLabel)}`}
              className="tw-truncate tw-font-semibold tw-text-iron-100 tw-no-underline desktop-hover:hover:tw-text-primary-300"
            >
              {report.author_handle ? `@${report.author_handle}` : profileLabel}
            </Link>
            <span className="tw-text-xs tw-text-iron-500">
              {new Date(report.created_at).toLocaleDateString(locale)}
            </span>
          </div>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-300">
            {t(locale, "contentModeration.preferences.reports.reason", {
              reason: report.reason
                .toLowerCase()
                .replaceAll("_", " ")
                .replace(/^./, (value) => value.toUpperCase()),
            })}
          </p>
          <p className="tw-text-primary-200 tw-mb-0 tw-mt-1 tw-text-sm tw-font-semibold">
            {getReportStatusLabel(report, locale)}
          </p>
          <ReportedContentPreview
            content={report.reported_content}
            dropId={report.drop_id}
            dropStatus={report.drop_status}
          />
        </div>
        {report.status === ApiContentModerationReportStatus.Open && (
          <button
            type="button"
            onClick={() => setConfirmWithdraw(true)}
            className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800"
          >
            {t(locale, "contentModeration.report.withdraw")}
          </button>
        )}
      </div>
      <MobileWrapperConfirmationDialog
        isOpen={confirmWithdraw}
        onClose={() => !mutation.isPending && setConfirmWithdraw(false)}
        onConfirm={() => mutation.mutate()}
        title={t(locale, "contentModeration.report.withdraw")}
        message={t(locale, "contentModeration.report.withdrawConfirm")}
        confirmText={t(locale, "contentModeration.report.withdraw")}
        cancelText={t(locale, "contentModeration.report.keepReport")}
        isConfirming={mutation.isPending}
        confirmVariant="destructive"
      />
    </li>
  );
}

export default function ReportsPreferencesSettings() {
  const locale = useBrowserLocale();
  const query = useInfiniteQuery({
    queryKey: MY_CONTENT_MODERATION_REPORTS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      fetchMyContentModerationReports({
        limit: PAGE_SIZE,
        ...(pageParam ? { before: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.length === PAGE_SIZE ? page.at(-1)?.cursor : undefined,
    retry: false,
  });
  const reports = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);

  return (
    <section
      aria-label={t(locale, "preferences.tabs.reports")}
      className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-py-5 sm:tw-px-6"
    >
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {t(locale, "contentModeration.preferences.reports.description")}
      </p>
      {query.isLoading && (
        <output className="tw-mt-4 tw-block tw-text-sm tw-text-iron-400">
          {t(locale, "contentModeration.preferences.reports.loading")}
        </output>
      )}
      {query.isError && (
        <p role="alert" className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-red">
          {t(locale, "contentModeration.preferences.reports.loadError")}
        </p>
      )}
      {!query.isLoading && !query.isError && reports.length === 0 && (
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400">
          {t(locale, "contentModeration.preferences.reports.empty")}
        </p>
      )}
      {reports.length > 0 && (
        <ul className="tw-m-0 tw-mt-3 tw-list-none tw-p-0">
          {reports.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </ul>
      )}
      {query.hasNextPage && (
        <button
          type="button"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
          className="tw-mt-4 tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 disabled:tw-cursor-default disabled:tw-opacity-50"
        >
          {query.isFetchingNextPage
            ? t(locale, "contentModeration.moderator.loadingMore")
            : t(locale, "contentModeration.moderator.loadMore")}
        </button>
      )}
    </section>
  );
}
