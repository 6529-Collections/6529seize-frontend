"use client";

import { ApiE2eeReportCategory } from "@/generated/models/ApiE2eeReportCategory";
import type { ApiE2eeTrustAndSafetyReport } from "@/generated/models/ApiE2eeTrustAndSafetyReport";
import type { ApiE2eeTrustAndSafetyReportPage } from "@/generated/models/ApiE2eeTrustAndSafetyReportPage";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US";
import {
  fetchE2eeReport,
  setE2eeReportHold,
} from "@/services/api/e2ee-reports-api";
import { ENCRYPTED_REPORTS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  type InfiniteData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";
import { formatTimestamp } from "./content-moderation-page.helpers";
import { readE2eeReportEvidence } from "./e2eeReportEvidence";

const CATEGORY_KEYS: Record<string, MessageKey> = {
  [ApiE2eeReportCategory.ChildSexualAbuseMaterial]:
    "e2ee.report.category.CHILD_SEXUAL_ABUSE_MATERIAL",
  [ApiE2eeReportCategory.CredibleThreatOfViolence]:
    "e2ee.report.category.CREDIBLE_THREAT_OF_VIOLENCE",
  [ApiE2eeReportCategory.NonConsensualIntimateImagery]:
    "e2ee.report.category.NON_CONSENSUAL_INTIMATE_IMAGERY",
  [ApiE2eeReportCategory.Doxxing]: "e2ee.report.category.DOXXING",
};

export function e2eeReportCategoryLabel(
  locale: ReturnType<typeof useBrowserLocale>,
  category: string
): string {
  const key = CATEGORY_KEYS[category];
  return key ? t(locale, key) : category;
}

/** Messages for the panel's always-mounted live regions. */
export interface E2eeReportAnnouncement {
  readonly status: string;
  readonly alert: string;
}

function replaceInPages(
  data: InfiniteData<ApiE2eeTrustAndSafetyReportPage> | undefined,
  report: ApiE2eeTrustAndSafetyReport
): InfiniteData<ApiE2eeTrustAndSafetyReportPage> | undefined {
  if (!data) {
    return data;
  }
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === report.id ? report : item)),
    })),
  };
}

function DetailRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-grid tw-gap-1 sm:tw-grid-cols-[10rem_1fr] sm:tw-gap-3">
      <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
        {label}
      </dt>
      <dd className="tw-m-0 tw-min-w-0 tw-break-all tw-text-sm tw-text-iron-100">
        {children}
      </dd>
    </div>
  );
}

/**
 * Loading, results and errors are shown in the panel's always-mounted live
 * regions. An error is set again only after a retry settles, so a repeated
 * failure is announced.
 */
function getDetailAnnouncement(
  locale: ReturnType<typeof useBrowserLocale>,
  state: {
    readonly loading: boolean;
    /** Defined only after a successful hold change. */
    readonly onHold: boolean | undefined;
    readonly loadFailed: boolean;
    readonly holdFailed: boolean;
  }
): E2eeReportAnnouncement {
  let status = "";
  if (state.loading) {
    status = t(
      locale,
      "contentModeration.moderator.encryptedReports.detailLoading"
    );
  } else if (state.onHold !== undefined) {
    status = t(
      locale,
      state.onHold
        ? "contentModeration.moderator.encryptedReports.heldStatus"
        : "contentModeration.moderator.encryptedReports.releasedStatus"
    );
  }
  let alert = "";
  if (state.loadFailed) {
    alert = t(
      locale,
      "contentModeration.moderator.encryptedReports.detailError"
    );
  } else if (state.holdFailed) {
    alert = t(
      locale,
      "contentModeration.moderator.encryptedReports.holdFailed"
    );
  }
  return { status, alert };
}

export default function E2eeReportDetail({
  profileId,
  reportId,
  onBack,
  onAnnounce,
}: {
  readonly profileId: string;
  readonly reportId: string;
  readonly onBack: () => void;
  readonly onAnnounce: (announcement: E2eeReportAnnouncement) => void;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const detailKey = [
    ...ENCRYPTED_REPORTS_QUERY_KEY,
    "detail",
    profileId,
    reportId,
  ] as const;
  // Each fetch is an audited read on the server: no background refetching.
  const query = useQuery({
    queryKey: detailKey,
    queryFn: ({ signal }) => fetchE2eeReport(reportId, signal),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const hold = useMutation({
    mutationFn: (onHold: boolean) => setE2eeReportHold(reportId, onHold),
    onSuccess: (report) => {
      queryClient.setQueryData(detailKey, report);
      queryClient.setQueriesData<InfiniteData<ApiE2eeTrustAndSafetyReportPage>>(
        { queryKey: [...ENCRYPTED_REPORTS_QUERY_KEY, "list", profileId] },
        (data) => replaceInPages(data, report)
      );
    },
  });

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const { status, alert } = getDetailAnnouncement(locale, {
    loading: query.isLoading,
    onHold: hold.isSuccess ? query.data?.on_hold : undefined,
    loadFailed: query.isError && !query.isFetching,
    holdFailed: hold.isError && !hold.isPending,
  });
  useEffect(() => {
    onAnnounce({ status, alert });
  }, [onAnnounce, status, alert]);

  const report = query.data;
  const evidence = report ? readE2eeReportEvidence(report.body) : null;
  const category = report
    ? e2eeReportCategoryLabel(locale, report.category)
    : "";

  return (
    <section
      aria-labelledby="e2ee-report-detail-heading"
      className="tw-mt-6 tw-space-y-5"
    >
      <button
        type="button"
        onClick={onBack}
        className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(locale, "contentModeration.moderator.encryptedReports.back")}
      </button>
      <h2
        id="e2ee-report-detail-heading"
        ref={headingRef}
        tabIndex={-1}
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {report
          ? category
          : t(locale, "contentModeration.moderator.encryptedReports.review")}
      </h2>
      {report && evidence && (
        <>
          <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4">
            <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
              {t(
                locale,
                "contentModeration.moderator.encryptedReports.scopeTitle"
              )}
            </p>
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, "contentModeration.moderator.encryptedReports.scope")}
            </p>
          </div>
          <figure className="tw-m-0 tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
            <figcaption className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              {t(
                locale,
                "contentModeration.moderator.encryptedReports.evidence"
              )}
            </figcaption>
            {evidence.readable ? (
              <blockquote className="tw-mx-0 tw-mb-0 tw-mt-3 tw-whitespace-pre-wrap tw-break-words tw-text-base tw-leading-7 tw-text-iron-50">
                {evidence.text ||
                  t(
                    locale,
                    "contentModeration.moderator.encryptedReports.evidenceEmpty"
                  )}
              </blockquote>
            ) : (
              <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-300">
                {t(
                  locale,
                  "contentModeration.moderator.encryptedReports.evidenceUnreadable"
                )}
              </p>
            )}
            {evidence.attachments.length > 0 && (
              <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-300">
                {t(
                  locale,
                  "contentModeration.moderator.encryptedReports.attachments",
                  { names: evidence.attachments.join(", ") }
                )}
              </p>
            )}
            <p
              className={`tw-mb-0 tw-mt-4 tw-flex tw-items-start tw-gap-2 tw-text-sm ${
                report.verified ? "tw-text-emerald-400" : "tw-text-amber-200"
              }`}
            >
              {report.verified ? (
                <CheckBadgeIcon
                  aria-hidden="true"
                  className="tw-size-5 tw-flex-none"
                />
              ) : (
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="tw-size-5 tw-flex-none"
                />
              )}
              <span>
                {t(
                  locale,
                  report.verified
                    ? "contentModeration.moderator.encryptedReports.signatureVerified"
                    : "contentModeration.moderator.encryptedReports.signatureUnverified"
                )}
              </span>
            </p>
          </figure>
          <div>
            <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
              {t(
                locale,
                "contentModeration.moderator.encryptedReports.details"
              )}
            </h3>
            <dl className="tw-mb-0 tw-mt-3 tw-space-y-3">
              <DetailRow
                label={t(
                  locale,
                  "contentModeration.moderator.encryptedReports.category"
                )}
              >
                {category}
              </DetailRow>
              <DetailRow
                label={t(
                  locale,
                  "contentModeration.moderator.encryptedReports.reported"
                )}
              >
                {formatTimestamp(report.created_at, locale)}
              </DetailRow>
              <DetailRow
                label={t(
                  locale,
                  "contentModeration.moderator.encryptedReports.sender"
                )}
              >
                {report.sender_profile_id ??
                  t(
                    locale,
                    "contentModeration.moderator.encryptedReports.unknownSender"
                  )}
              </DetailRow>
              <DetailRow
                label={t(
                  locale,
                  "contentModeration.moderator.encryptedReports.reporter"
                )}
              >
                {report.reporter_profile_id}
              </DetailRow>
              {report.notes && (
                <DetailRow
                  label={t(
                    locale,
                    "contentModeration.moderator.encryptedReports.notes"
                  )}
                >
                  <span className="tw-whitespace-pre-wrap tw-break-words">
                    {report.notes}
                  </span>
                </DetailRow>
              )}
              <DetailRow
                label={t(
                  locale,
                  "contentModeration.moderator.encryptedReports.retention"
                )}
              >
                {report.on_hold || report.expires_at === null
                  ? t(
                      locale,
                      "contentModeration.moderator.encryptedReports.retentionHeld"
                    )
                  : t(
                      locale,
                      "contentModeration.moderator.encryptedReports.retentionUntil",
                      {
                        date: formatTimestamp(report.expires_at, locale) ?? "",
                      }
                    )}
              </DetailRow>
            </dl>
          </div>
          <div className="tw-space-y-2">
            <button
              type="button"
              aria-describedby="e2ee-report-hold-help"
              disabled={hold.isPending}
              onClick={() => hold.mutate(!report.on_hold)}
              className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50"
            >
              {t(
                locale,
                report.on_hold
                  ? "contentModeration.moderator.encryptedReports.release"
                  : "contentModeration.moderator.encryptedReports.hold"
              )}
            </button>
            <p
              id="e2ee-report-hold-help"
              className="tw-m-0 tw-text-xs tw-text-iron-400"
            >
              {t(
                locale,
                "contentModeration.moderator.encryptedReports.holdHelp"
              )}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
