"use client";

import { useAuth } from "@/components/auth/Auth";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import type { ApiContentModerationQueueItem } from "@/generated/models/ApiContentModerationQueueItem";
import { ApiContentModerationDropDecisionRequestDecisionEnum } from "@/generated/models/ApiContentModerationDropDecisionRequest";
import { ApiModeratedProfileStatus } from "@/generated/models/ApiModeratedProfileStatus";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useContentModeratorAccess } from "@/hooks/content-moderation/useContentModeratorAccess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  decideModeratedDrop,
  fetchContentModerationQueue,
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
} from "@/services/content-moderation/content-moderation-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const getSnapshotContent = (snapshot: Record<string, unknown>): string => {
  const title = snapshot["title"];
  const parts = snapshot["parts"];
  const contentParts =
    typeof title === "string" && title.trim().length > 0 ? [title] : [];
  if (!Array.isArray(parts)) return contentParts.join("\n\n");
  return [
    ...contentParts,
    ...parts
      .map((part) => {
        if (part === null || typeof part !== "object") return "";
        const content = (part as Record<string, unknown>)["content"];
        return typeof content === "string" ? content : "";
      })
      .filter((content) => content.length > 0),
  ].join("\n\n");
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

interface SnapshotAsset {
  readonly key: string;
  readonly label: string;
  readonly url: string | null;
}

const getSnapshotAssets = (
  snapshot: Record<string, unknown>
): SnapshotAsset[] => {
  const parts = snapshot["parts"];
  if (!Array.isArray(parts)) return [];
  return parts.flatMap((part, partIndex) => {
    const partRecord = getRecord(part);
    if (!partRecord) return [];
    const media = Array.isArray(partRecord["media"]) ? partRecord["media"] : [];
    const attachments = Array.isArray(partRecord["attachments"])
      ? partRecord["attachments"]
      : [];
    return [
      ...media.flatMap((value, mediaIndex): SnapshotAsset[] => {
        const item = getRecord(value);
        if (
          !item ||
          typeof item["url"] !== "string" ||
          typeof item["mime_type"] !== "string"
        )
          return [];
        return [
          {
            key: `part-${partIndex}-media-${mediaIndex}`,
            label: item["mime_type"],
            url: item["url"],
          },
        ];
      }),
      ...attachments.flatMap((value, attachmentIndex): SnapshotAsset[] => {
        const item = getRecord(value);
        if (!item || typeof item["original_file_name"] !== "string") return [];
        const status =
          typeof item["status"] === "string"
            ? ` (${formatContentModerationEnum(item["status"])})`
            : "";
        return [
          {
            key: `part-${partIndex}-attachment-${attachmentIndex}`,
            label: `${item["original_file_name"]}${status}`,
            url: typeof item["ipfs_url"] === "string" ? item["ipfs_url"] : null,
          },
        ];
      }),
    ];
  });
};

const getSafeAssetUrl = (value: string | null): string | null => {
  if (!value) return null;
  try {
    const resolved = resolveIpfsUrlSync(value);
    const url = new URL(resolved);
    return url.protocol === "http:" || url.protocol === "https:"
      ? resolved
      : null;
  } catch {
    return null;
  }
};

const formatEvidence = (value: unknown): string => {
  if (typeof value === "string") return value;
  try {
    const serialized: unknown = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : String(value);
  } catch {
    return String(value);
  }
};

const formatTimestamp = (
  value: unknown,
  locale: SupportedLocale
): string | null => {
  let timestamp = Number.NaN;
  if (typeof value === "number") {
    timestamp = value;
  } else if (typeof value === "string") {
    timestamp = Number(value);
  }
  if (!Number.isFinite(timestamp)) return null;
  return formatDate(locale, timestamp, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function ModerationQueueCard({
  item,
}: {
  readonly item: ApiContentModerationQueueItem;
}) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const content = getSnapshotContent(item.content_snapshot);
  const assets = getSnapshotAssets(item.content_snapshot);
  const parentSnapshot = getRecord(item.content_snapshot["parent_context"]);
  const parentContent = parentSnapshot
    ? getSnapshotContent(parentSnapshot)
    : "";

  const decisionMutation = useMutation({
    mutationFn: (
      decision: ApiContentModerationDropDecisionRequestDecisionEnum
    ) => decideModeratedDrop(item.drop_id, { decision, reason: reason.trim() }),
    onSuccess: (response) => {
      setGlobalDropModerationOverride(response.drop_id, response.status);
      void queryClient.invalidateQueries({
        queryKey: MODERATION_QUEUE_QUERY_KEY,
      });
      void invalidateContentModerationPresentation(queryClient);
      setToast({
        message: t(locale, "contentModeration.moderator.decisionSuccess"),
        type: "success",
      });
      setReason("");
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
        reason: reason.trim(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: MODERATION_QUEUE_QUERY_KEY,
      });
      void invalidateContentModerationPresentation(queryClient);
      setToast({
        message: t(locale, "contentModeration.moderator.profileSuccess"),
        type: "success",
      });
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
  const reasonMissing = reason.trim().length === 0;
  const actionClass =
    "tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 disabled:tw-cursor-default disabled:tw-opacity-40 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

  return (
    <article className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 tw-text-xs tw-text-iron-500">
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
        <span aria-hidden="true">·</span>
        <span>
          {t(locale, "contentModeration.moderator.author", {
            profileId: item.author_profile_id,
          })}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {t(locale, "contentModeration.moderator.currentState", {
            state: formatContentModerationEnum(item.moderation.status),
          })}
        </span>
      </div>
      <pre className="tw-mb-0 tw-mt-4 tw-max-h-72 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-font-sans tw-text-sm tw-leading-6 tw-text-iron-200">
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

      <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/50 tw-p-4">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
          {t(locale, "contentModeration.moderator.aiAssessment")}
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">
          {getAiRecommendationText(item, locale)}
        </p>
        {typeof item.ai_category === "string" &&
          item.ai_category.length > 0 && (
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
              {t(locale, "contentModeration.moderator.aiCategory", {
                value: formatContentModerationEnum(item.ai_category),
              })}
            </p>
          )}
        {typeof item.ai_rationale === "string" &&
          item.ai_rationale.length > 0 && (
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
              {item.ai_rationale}
            </p>
          )}
        {(item.ai_evidence?.length ?? 0) > 0 && (
          <ul className="tw-mb-0 tw-mt-3 tw-space-y-1 tw-pl-5 tw-text-sm tw-text-iron-400">
            {(item.ai_evidence ?? []).map((evidence, index) => (
              <li key={`${item.id}-evidence-${index}`}>
                {formatEvidence(evidence)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/30 tw-p-4">
        <summary className="tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-300">
          {t(locale, "contentModeration.moderator.history", {
            count: formatInteger(locale, item.history.length),
          })}
        </summary>
        {item.history.length === 0 ? (
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-500">
            {t(locale, "contentModeration.moderator.noHistory")}
          </p>
        ) : (
          <ol className="tw-mb-0 tw-mt-3 tw-space-y-3 tw-pl-5">
            {item.history.map((entry: unknown, index) => {
              const entryRecord = getRecord(entry);
              if (entryRecord === null) return null;
              const action = formatEvidence(
                entryRecord["action"] ??
                  t(locale, "contentModeration.moderator.stateChanged")
              );
              const previous = entryRecord["previous_state"];
              const next = entryRecord["new_state"];
              const entryReason = entryRecord["reason"];
              const actor = entryRecord["actor_profile_id"];
              const timestamp = formatTimestamp(
                entryRecord["created_at"],
                locale
              );
              return (
                <li
                  key={`${item.id}-history-${index}`}
                  className="tw-text-sm tw-text-iron-400"
                >
                  <span className="tw-font-semibold tw-text-iron-300">
                    {formatContentModerationEnum(action)}
                  </span>
                  {typeof previous === "string" && typeof next === "string" && (
                    <span>{` — ${formatContentModerationEnum(previous)} → ${formatContentModerationEnum(next)}`}</span>
                  )}
                  {typeof entryReason === "string" && entryReason && (
                    <p className="tw-mb-0 tw-mt-1 tw-text-iron-500">
                      {entryReason}
                    </p>
                  )}
                  {(timestamp !== null || typeof actor === "string") && (
                    <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-600">
                      {[timestamp, typeof actor === "string" ? actor : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </details>

      <label className="tw-mt-5 tw-block">
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

      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2">
        <button
          type="button"
          className={actionClass}
          disabled={isPending || reasonMissing}
          onClick={() =>
            decisionMutation.mutate(
              ApiContentModerationDropDecisionRequestDecisionEnum.Allow
            )
          }
        >
          {t(locale, "contentModeration.moderator.allow")}
        </button>
        <button
          type="button"
          className={actionClass}
          disabled={isPending || reasonMissing}
          onClick={() =>
            decisionMutation.mutate(
              ApiContentModerationDropDecisionRequestDecisionEnum.Quarantine
            )
          }
        >
          {t(locale, "contentModeration.moderator.quarantine")}
        </button>
        <button
          type="button"
          className={`${actionClass} tw-border-red/50 tw-text-red`}
          disabled={isPending || reasonMissing}
          onClick={() =>
            decisionMutation.mutate(
              ApiContentModerationDropDecisionRequestDecisionEnum.Remove
            )
          }
        >
          {t(locale, "contentModeration.moderator.remove")}
        </button>
        <span
          className="tw-mx-1 tw-border-l tw-border-solid tw-border-iron-700"
          aria-hidden="true"
        />
        <button
          type="button"
          className={actionClass}
          disabled={isPending || reasonMissing}
          onClick={() =>
            profileMutation.mutate(ApiModeratedProfileStatus.Suspended)
          }
        >
          {t(locale, "contentModeration.moderator.suspend")}
        </button>
        <button
          type="button"
          className={actionClass}
          disabled={isPending || reasonMissing}
          onClick={() =>
            profileMutation.mutate(ApiModeratedProfileStatus.Active)
          }
        >
          {t(locale, "contentModeration.moderator.reinstate")}
        </button>
      </div>
    </article>
  );
}

export default function ContentModerationPageClient() {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const accessQuery = useContentModeratorAccess();
  const hasModeratorIdentity =
    Boolean(connectedProfile?.id) && activeProfileProxy === null;
  const canModerate = accessQuery.data?.moderator === true;
  const queueQuery = useQuery({
    queryKey: MODERATION_QUEUE_QUERY_KEY,
    queryFn: () => fetchContentModerationQueue({ limit: 50 }),
    enabled: canModerate,
    retry: false,
  });

  return (
    <main className="tailwind-scope tw-mx-auto tw-w-full tw-max-w-4xl tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-12">
      <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-iron-50">
        {t(locale, "contentModeration.moderator.title")}
      </h1>
      <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-400">
        {t(locale, "contentModeration.moderator.description")}
      </p>

      {hasModeratorIdentity &&
        (accessQuery.isLoading || queueQuery.isLoading) && (
          <output className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-iron-400">
            {t(locale, "contentModeration.moderator.loading")}
          </output>
        )}
      {(!hasModeratorIdentity || (accessQuery.isSuccess && !canModerate)) && (
        <p
          role="alert"
          className="tw-mb-0 tw-mt-8 tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-text-sm tw-text-iron-300"
        >
          {t(locale, "contentModeration.moderator.accessDenied")}
        </p>
      )}
      {(accessQuery.isError || queueQuery.isError) && (
        <p role="alert" className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-red">
          {t(locale, "contentModeration.moderator.loadError")}
        </p>
      )}
      {canModerate && queueQuery.data?.length === 0 && (
        <p className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-iron-400">
          {t(locale, "contentModeration.moderator.empty")}
        </p>
      )}
      {(queueQuery.data?.length ?? 0) > 0 && (
        <div className="tw-mt-8 tw-space-y-5">
          {(queueQuery.data ?? []).map((item) => (
            <ModerationQueueCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
