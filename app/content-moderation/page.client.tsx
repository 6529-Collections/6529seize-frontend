"use client";

import { useAuth } from "@/components/auth/Auth";
import ContentModerationNoAccess from "@/components/content-moderation/ContentModerationNoAccess";
import type { ApiContentModerationQueueItem } from "@/generated/models/ApiContentModerationQueueItem";
import type { ApiContentModerationProfileStatusResponse } from "@/generated/models/ApiContentModerationProfileStatusResponse";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import { ApiContentModerationDropDecisionRequestDecisionEnum } from "@/generated/models/ApiContentModerationDropDecisionRequest";
import { ApiModeratedProfileStatus } from "@/generated/models/ApiModeratedProfileStatus";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  CONTENT_MODERATOR_ACCESS_QUERY_KEY,
  useContentModeratorAccess,
} from "@/hooks/content-moderation/useContentModeratorAccess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  decideModeratedDrop,
  fetchContentModerationQueue,
  fetchSuspendedModerationProfiles,
  setModeratedProfileStatus,
} from "@/services/api/content-moderation-api";
import { setGlobalDropModerationOverride } from "@/services/content-moderation/content-moderation-state";
import {
  formatContentModerationEnum,
  getAiRecommendationText,
} from "@/services/content-moderation/content-moderation-formatters";
import {
  invalidateContentModerationPresentation,
  MODERATION_QUEUE_QUERY_KEY,
  PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY,
  SUSPENDED_MODERATION_PROFILES_QUERY_KEY,
} from "@/services/content-moderation/content-moderation-query";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  formatEvidence,
  formatTimestamp,
  getRecord,
  getSafeAssetUrl,
  getSnapshotAssets,
  getSnapshotContent,
} from "./content-moderation-page.helpers";
import BlockActivityFeed from "./BlockActivityFeed";
import ContentModerationHistory from "./ContentModerationHistory";
import SuspendedProfileCard from "./SuspendedProfileCard";
import ContentModerationTabs from "./ContentModerationTabs";
import {
  getModerationTab,
  type ModerationTab,
} from "./content-moderation-tabs";

interface ModerationDataState {
  readonly isLoading: boolean;
  readonly isError: boolean;
}

const MODERATION_QUEUE_PAGE_SIZE = 50;

function isReportsTab(tab: ModerationTab): tab is "OPEN" | "RESOLVED" {
  return tab === "OPEN" || tab === "RESOLVED";
}

function getModeratorPermissions(
  access: ReturnType<typeof useContentModeratorAccess>,
  hasModeratorIdentity: boolean,
  fetchingProfile: boolean
) {
  const canModerate = access.data?.moderator === true;
  const permissionsLoading =
    fetchingProfile || (hasModeratorIdentity && access.isLoading);
  return {
    canModerate,
    permissionsLoading,
    moderatorContentReady:
      hasModeratorIdentity && canModerate && !permissionsLoading,
  };
}

function getActiveDataState(
  tab: ModerationTab,
  queueState: ModerationDataState,
  suspendedState: ModerationDataState,
  enabled: boolean
): ModerationDataState {
  if (!enabled || tab === "BLOCK_ACTIVITY") {
    return { isLoading: false, isError: false };
  }
  if (tab === "SUSPENDED") {
    return suspendedState;
  }
  return queueState;
}

function ModerationQueueCard({
  item,
}: {
  readonly item: ApiContentModerationQueueItem;
}) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [selectedDecision, setSelectedDecision] =
    useState<ApiContentModerationDropDecisionRequestDecisionEnum | null>(null);
  const [pendingProfileStatus, setPendingProfileStatus] =
    useState<ApiModeratedProfileStatus | null>(null);
  const content = getSnapshotContent(item.content_snapshot);
  const assets = getSnapshotAssets(item.content_snapshot);
  const parentSnapshot = getRecord(item.content_snapshot["parent_context"]);
  const parentContent = parentSnapshot
    ? getSnapshotContent(parentSnapshot)
    : "";
  const reportedAt = formatTimestamp(item.created_at, locale);
  const authorPfp = getSafeAssetUrl(item.author_pfp);
  const authorLabel = item.author_handle ?? item.author_profile_id;
  const reporterPfp = getSafeAssetUrl(item.reporter_pfp);
  const reporterLabel = item.reporter_handle ?? item.reporter_profile_id;

  const decisionMutation = useMutation({
    mutationFn: (
      decision: ApiContentModerationDropDecisionRequestDecisionEnum
    ) =>
      decideModeratedDrop(item.drop_id, {
        decision,
        reason: reason.trim() || null,
      }),
    onSuccess: (response) => {
      setGlobalDropModerationOverride(response.drop_id, response.status);
      void queryClient.invalidateQueries({
        queryKey: MODERATION_QUEUE_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: CONTENT_MODERATOR_ACCESS_QUERY_KEY,
      });
      void invalidateContentModerationPresentation(queryClient);
      setToast({
        message: t(locale, "contentModeration.moderator.decisionSuccess"),
        type: "success",
      });
      setReason("");
      setSelectedDecision(null);
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "contentModeration.moderator.decisionError"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
  });

  const profileMutation = useMutation({
    mutationFn: (status: ApiModeratedProfileStatus) =>
      setModeratedProfileStatus(item.author_profile_id, {
        status,
        reason: reason.trim() || null,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData<ApiContentModerationProfileStatusResponse>(
        [...PUBLIC_PROFILE_MODERATION_STATUS_QUERY_KEY, item.author_profile_id],
        response
      );
      void queryClient.invalidateQueries({
        queryKey: MODERATION_QUEUE_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: CONTENT_MODERATOR_ACCESS_QUERY_KEY,
      });
      void invalidateContentModerationPresentation(queryClient);
      setToast({
        message: t(locale, "contentModeration.moderator.profileSuccess"),
        type: "success",
      });
      setPendingProfileStatus(null);
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "contentModeration.moderator.profileError"),
        description: t(locale, "contentModeration.error.retry"),
        details: getToastErrorDetails(error),
      });
    },
  });

  const isPending = decisionMutation.isPending || profileMutation.isPending;
  const isResolved = item.status !== ApiContentModerationReportStatus.Open;

  return (
    <article className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 tw-text-xs tw-text-iron-200">
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          {authorPfp ? (
            <Image
              src={authorPfp}
              alt=""
              width={24}
              height={24}
              className="tw-size-6 tw-rounded-md tw-bg-iron-800 tw-object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="tw-size-6 tw-rounded-md tw-bg-iron-800"
            />
          )}
          {item.author_handle ? (
            <Link
              href={`/${item.author_handle}`}
              className="tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-text-primary-300"
            >
              {authorLabel}
            </Link>
          ) : (
            <span className="tw-font-semibold tw-text-iron-100">
              {authorLabel}
            </span>
          )}
        </span>
        <span aria-hidden="true">·</span>
        <span className="tw-inline-flex tw-items-center tw-gap-1.5">
          {reporterPfp ? (
            <Image
              src={reporterPfp}
              alt=""
              width={20}
              height={20}
              className="tw-size-5 tw-rounded-full tw-bg-iron-800 tw-object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="tw-size-5 tw-rounded-full tw-bg-iron-800"
            />
          )}
          {item.reporter_handle ? (
            <Link
              href={`/${item.reporter_handle}`}
              className="tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-text-primary-300"
            >
              {t(locale, "contentModeration.moderator.reportedBy", {
                profile: `@${reporterLabel}`,
              })}
            </Link>
          ) : (
            <span>
              {t(locale, "contentModeration.moderator.reportedBy", {
                profile: reporterLabel,
              })}
            </span>
          )}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {t(
            locale,
            item.report_count === 1
              ? "contentModeration.moderator.reportCount.one"
              : "contentModeration.moderator.reportCount.many",
            { count: formatInteger(locale, item.report_count) }
          )}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {t(locale, "contentModeration.moderator.reportedFor", {
            reason: formatContentModerationEnum(item.reason),
          })}
        </span>
        {reportedAt && (
          <>
            <span aria-hidden="true">·</span>
            <time dateTime={new Date(item.created_at).toISOString()}>
              {t(locale, "contentModeration.moderator.reportedAt", {
                date: reportedAt,
              })}
            </time>
          </>
        )}
        <span aria-hidden="true">·</span>
        <span>
          {t(locale, "contentModeration.moderator.currentState", {
            state: formatContentModerationEnum(item.moderation.status),
          })}
        </span>
      </div>
      <pre className="tw-mb-0 tw-mt-4 tw-max-h-72 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-font-sans tw-text-base tw-leading-7 tw-text-iron-50">
        {content || t(locale, "contentModeration.moderator.noTextContent")}
      </pre>
      {assets.length > 0 && (
        <div className="tw-mt-4">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
            {t(locale, "contentModeration.moderator.reportedAssets")}
          </p>
          <ul className="tw-mb-0 tw-mt-2 tw-space-y-2 tw-pl-5 tw-text-sm tw-text-iron-400">
            {assets.map((asset) => {
              const safeUrl = getSafeAssetUrl(asset.url);
              return (
                <li key={`${item.id}-${asset.key}`}>
                  {safeUrl ? (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:tw-text-primary-200 tw-break-all tw-text-primary-300"
                    >
                      {asset.label}
                    </a>
                  ) : (
                    asset.label
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {item.notes && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-400">
          {item.notes}
        </p>
      )}
      {parentContent && (
        <div className="tw-mt-4">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
            {t(locale, "contentModeration.moderator.parentContext")}
          </p>
          <pre className="tw-mb-0 tw-mt-2 tw-max-h-44 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-xl tw-bg-iron-900/70 tw-p-4 tw-font-sans tw-text-sm tw-leading-6 tw-text-iron-300">
            {parentContent}
          </pre>
        </div>
      )}

      <details className="tw-mt-4 tw-rounded-xl tw-bg-iron-900/55 tw-p-4">
        <summary className="tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-100">
          {t(locale, "contentModeration.moderator.aiAssessment")}:{" "}
          {getAiRecommendationText(item, locale)}
        </summary>
        {typeof item.ai_category === "string" &&
          item.ai_category.length > 0 &&
          item.ai_category !== "NONE" && (
            <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-300">
              {t(locale, "contentModeration.moderator.aiCategory", {
                value: formatContentModerationEnum(item.ai_category),
              })}
            </p>
          )}
        {typeof item.ai_rationale === "string" &&
          item.ai_rationale.length > 0 && (
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-200">
              {item.ai_rationale}
            </p>
          )}
        {(item.ai_evidence?.length ?? 0) > 0 && (
          <ul className="tw-mb-0 tw-mt-3 tw-space-y-1 tw-pl-5 tw-text-sm tw-text-iron-300">
            {(item.ai_evidence ?? []).map((evidence, index) => (
              <li key={`${item.id}-evidence-${index}`}>
                {formatEvidence(evidence)}
              </li>
            ))}
          </ul>
        )}
      </details>

      <ContentModerationHistory itemId={item.id} history={item.history} />

      {isResolved ? (
        <div className="tw-mt-5 tw-rounded-xl tw-bg-iron-900/55 tw-p-4">
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {t(locale, "contentModeration.moderator.resolvedAs", {
              decision: formatContentModerationEnum(item.status),
            })}
          </p>
          {item.resolution_reason && (
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">
              {item.resolution_reason}
            </p>
          )}
        </div>
      ) : (
        <section className="tw-mt-5" aria-labelledby={`${item.id}-decision`}>
          <h3
            id={`${item.id}-decision`}
            className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "contentModeration.moderator.chooseDecision")}
          </h3>
          <div className="tw-mt-3 tw-grid tw-gap-2 lg:tw-grid-cols-3">
            {(
              [
                {
                  value:
                    ApiContentModerationDropDecisionRequestDecisionEnum.Allow,
                  label: "contentModeration.moderator.allow",
                  description: "contentModeration.moderator.allowDescription",
                },
                {
                  value:
                    ApiContentModerationDropDecisionRequestDecisionEnum.Quarantine,
                  label: "contentModeration.moderator.quarantine",
                  description:
                    "contentModeration.moderator.quarantineDescription",
                },
                {
                  value:
                    ApiContentModerationDropDecisionRequestDecisionEnum.Remove,
                  label: "contentModeration.moderator.remove",
                  description: "contentModeration.moderator.removeDescription",
                },
              ] as const
            ).map((choice) => (
              <button
                key={choice.value}
                type="button"
                aria-pressed={selectedDecision === choice.value}
                disabled={isPending}
                onClick={() => setSelectedDecision(choice.value)}
                className={`tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-text-left tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50 ${
                  selectedDecision === choice.value
                    ? "tw-border-primary-400 tw-bg-primary-500/10"
                    : "tw-border-iron-800 tw-bg-iron-900/45 hover:tw-border-iron-600 hover:tw-bg-iron-900"
                }`}
              >
                <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-50">
                  {t(locale, choice.label)}
                </span>
                <span className="tw-mt-1 tw-block tw-text-sm tw-leading-5 tw-text-iron-300">
                  {t(locale, choice.description)}
                </span>
              </button>
            ))}
          </div>
          <label className="tw-mt-4 tw-block">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
              {t(locale, "contentModeration.moderator.reason")}
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t(
                locale,
                "contentModeration.moderator.reasonPlaceholder"
              )}
              className="tw-mt-2 tw-w-full tw-resize-y tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
            />
          </label>
          <div className="tw-mt-4 tw-flex tw-justify-end">
            <button
              type="button"
              disabled={isPending || selectedDecision === null}
              onClick={() => {
                if (selectedDecision !== null) {
                  decisionMutation.mutate(selectedDecision);
                }
              }}
              className="tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-primary-400 disabled:tw-cursor-default disabled:tw-opacity-40"
            >
              {t(locale, "contentModeration.moderator.applyDecision")}
            </button>
          </div>
        </section>
      )}

      <section className="tw-mt-5 tw-rounded-xl tw-bg-iron-900/35 tw-p-4">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
          <div>
            <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {t(locale, "contentModeration.moderator.authorStatus")}
            </h3>
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-300">
              {formatContentModerationEnum(item.author_status)}
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              setPendingProfileStatus(
                item.author_status === ApiModeratedProfileStatus.Suspended
                  ? ApiModeratedProfileStatus.Active
                  : ApiModeratedProfileStatus.Suspended
              )
            }
            className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-iron-800 disabled:tw-cursor-default disabled:tw-opacity-50"
          >
            {t(
              locale,
              item.author_status === ApiModeratedProfileStatus.Suspended
                ? "contentModeration.moderator.reinstate"
                : "contentModeration.moderator.suspend"
            )}
          </button>
        </div>
        {pendingProfileStatus !== null && (
          <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
            <p className="tw-m-0 tw-flex-1 tw-text-sm tw-text-iron-200">
              {t(
                locale,
                pendingProfileStatus === ApiModeratedProfileStatus.Suspended
                  ? "contentModeration.moderator.confirmSuspend"
                  : "contentModeration.moderator.confirmReinstate"
              )}
            </p>
            <button
              type="button"
              className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-sm tw-font-semibold tw-text-iron-300 hover:tw-text-white"
              onClick={() => setPendingProfileStatus(null)}
            >
              {t(locale, "contentModeration.report.cancel")}
            </button>
            <button
              type="button"
              disabled={profileMutation.isPending}
              className="tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-iron-100 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-black hover:tw-bg-white disabled:tw-cursor-default disabled:tw-opacity-50"
              onClick={() => profileMutation.mutate(pendingProfileStatus)}
            >
              {t(locale, "contentModeration.moderator.confirm")}
            </button>
          </div>
        )}
      </section>
    </article>
  );
}

export default function ContentModerationPageClient() {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, fetchingProfile } = useAuth();
  const pathname = usePathname();
  const activeTab = getModerationTab(pathname.split("/")[2]) ?? "OPEN";
  const accessQuery = useContentModeratorAccess();
  const hasModeratorIdentity =
    Boolean(connectedProfile?.id) && activeProfileProxy === null;
  const { canModerate, permissionsLoading, moderatorContentReady } =
    getModeratorPermissions(accessQuery, hasModeratorIdentity, fetchingProfile);
  const reportsTabActive = isReportsTab(activeTab);
  const reportsView = activeTab === "RESOLVED" ? "RESOLVED" : "OPEN";
  const queueQuery = useInfiniteQuery({
    queryKey: [...MODERATION_QUEUE_QUERY_KEY, reportsView],
    queryFn: ({ pageParam }) =>
      fetchContentModerationQueue({
        limit: MODERATION_QUEUE_PAGE_SIZE,
        view: reportsView,
        ...(pageParam === undefined ? {} : { before: pageParam }),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === MODERATION_QUEUE_PAGE_SIZE
        ? lastPage.at(-1)?.cursor
        : undefined,
    enabled: moderatorContentReady && reportsTabActive,
    retry: false,
  });
  const suspendedQuery = useInfiniteQuery({
    queryKey: SUSPENDED_MODERATION_PROFILES_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      fetchSuspendedModerationProfiles({
        limit: MODERATION_QUEUE_PAGE_SIZE,
        ...(pageParam === undefined ? {} : { before: pageParam }),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === MODERATION_QUEUE_PAGE_SIZE
        ? lastPage.at(-1)?.cursor
        : undefined,
    enabled: moderatorContentReady && activeTab === "SUSPENDED",
    retry: false,
  });
  const queueItems = useMemo(
    () => queueQuery.data?.pages.flat() ?? [],
    [queueQuery.data]
  );
  const suspendedProfiles = useMemo(
    () => suspendedQuery.data?.pages.flat() ?? [],
    [suspendedQuery.data]
  );
  const activeDataState = getActiveDataState(
    activeTab,
    queueQuery,
    suspendedQuery,
    moderatorContentReady
  );
  return (
    <main className="tailwind-scope tw-min-h-dvh tw-w-full tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800 tw-bg-black tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-12 lg:tw-px-8">
      <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl">
        {t(locale, "contentModeration.moderator.title")}
      </h1>
      <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-400">
        {t(locale, "contentModeration.moderator.description")}
      </p>

      {permissionsLoading && (
        <output className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-iron-300">
          {t(locale, "contentModeration.moderator.checkingPermissions")}
        </output>
      )}
      {!permissionsLoading &&
        (!hasModeratorIdentity || (accessQuery.isSuccess && !canModerate)) && (
          <ContentModerationNoAccess locale={locale} />
        )}
      {moderatorContentReady && (
        <ContentModerationTabs
          activeTab={activeTab}
          openCount={accessQuery.data?.open_report_count ?? 0}
          resolvedCount={accessQuery.data?.resolved_report_count ?? 0}
          suspendedCount={accessQuery.data?.suspended_profile_count ?? 0}
        />
      )}
      <div
        id="moderation-tabpanel"
        role={moderatorContentReady ? "tabpanel" : undefined}
        aria-labelledby={
          moderatorContentReady ? `moderation-tab-${activeTab}` : undefined
        }
        tabIndex={moderatorContentReady ? 0 : undefined}
        className="focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
      >
        {moderatorContentReady && activeDataState.isLoading && (
          <output className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-iron-400">
            {t(locale, "contentModeration.moderator.loading")}
          </output>
        )}
        {hasModeratorIdentity &&
          (accessQuery.isError || activeDataState.isError) && (
            <p role="alert" className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-red">
              {t(locale, "contentModeration.moderator.loadError")}
            </p>
          )}
        {moderatorContentReady &&
          reportsTabActive &&
          queueItems.length === 0 &&
          !queueQuery.isLoading && (
            <p className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-iron-400">
              {t(
                locale,
                activeTab === "OPEN"
                  ? "contentModeration.moderator.empty"
                  : "contentModeration.moderator.emptyResolved"
              )}
            </p>
          )}
        {moderatorContentReady && reportsTabActive && queueItems.length > 0 && (
          <div className="tw-mt-8 tw-space-y-5">
            {queueItems.map((item) => (
              <ModerationQueueCard key={item.id} item={item} />
            ))}
            {queueQuery.hasNextPage && (
              <div className="tw-flex tw-justify-center tw-pt-2">
                <button
                  type="button"
                  disabled={queueQuery.isFetchingNextPage}
                  onClick={() => void queueQuery.fetchNextPage()}
                  className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50"
                >
                  {t(
                    locale,
                    queueQuery.isFetchingNextPage
                      ? "contentModeration.moderator.loadingMore"
                      : "contentModeration.moderator.loadMore"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
        {moderatorContentReady &&
          activeTab === "SUSPENDED" &&
          suspendedProfiles.length === 0 &&
          !suspendedQuery.isLoading && (
            <p className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-iron-400">
              {t(locale, "contentModeration.moderator.emptySuspended")}
            </p>
          )}
        {moderatorContentReady && activeTab === "BLOCK_ACTIVITY" && (
          <BlockActivityFeed enabled={moderatorContentReady} />
        )}
        {moderatorContentReady &&
          activeTab === "SUSPENDED" &&
          suspendedProfiles.length > 0 && (
            <div className="tw-mt-8 tw-space-y-3">
              {suspendedProfiles.map((profile) => (
                <SuspendedProfileCard
                  key={profile.profile_id}
                  profile={profile}
                />
              ))}
              {suspendedQuery.hasNextPage && (
                <div className="tw-flex tw-justify-center tw-pt-2">
                  <button
                    type="button"
                    disabled={suspendedQuery.isFetchingNextPage}
                    onClick={() => void suspendedQuery.fetchNextPage()}
                    className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 disabled:tw-cursor-default disabled:tw-opacity-50"
                  >
                    {t(
                      locale,
                      suspendedQuery.isFetchingNextPage
                        ? "contentModeration.moderator.loadingMore"
                        : "contentModeration.moderator.loadMore"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
      </div>
    </main>
  );
}
