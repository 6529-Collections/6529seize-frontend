"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  ApiArtworkDocumentationContextConfirmationStatusEnum,
  ApiArtworkDocumentationContextLifecycleEnum,
} from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type {
  DocumentationDraftController,
  SaveState,
} from "@/lib/artwork-documentation/draft-controller";
import { confirmationCopyMatches } from "@/lib/artwork-documentation/confirmation";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import {
  confirmDocumentation,
  documentationWorkspacePath,
  getDocumentationContext,
  getDocumentationRevisions,
  getDocumentationPublicPreview,
  reviewDocumentationRevision,
} from "@/services/api/artwork-documentation-api";
import { formatDate } from "@/i18n/format";
import { documentationFieldLabel } from "@/i18n/messages/artwork-documentation-fields";
import { useDocumentationActor } from "./DocumentationAuthGate";
import DocumentationSummary from "./DocumentationSummary";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationReview({
  context,
  controller,
  saveState,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
  readonly saveState: SaveState;
}) {
  const { msg, locale } = useDocumentationMessages();
  const { connectedProfile, actorKey } = useDocumentationActor();
  const [acknowledged, setAcknowledged] = useState(false);
  const [preview, setPreview] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const key = useRef({
    version: context.draft_version,
    value: crypto.randomUUID(),
  });
  const revisions = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "revisions",
      actorKey,
      context.latest_revision_id ?? "none"
    ),
    queryFn: ({ signal }) => getDocumentationRevisions(context.id, signal),
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const previewQuery = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "public-preview",
      actorKey,
      String(context.draft_version)
    ),
    queryFn: ({ signal }) => getDocumentationPublicPreview(context.id, signal),
    enabled: preview,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const missing = Object.values(context.modules).flatMap(
    (module) => module.completeness.missing
  );
  const canConfirm =
    context.capabilities.confirm_as_artist &&
    !missing.length &&
    saveState === "clean" &&
    context.lifecycle === ApiArtworkDocumentationContextLifecycleEnum.Active &&
    confirmationCopyMatches(context.profile);
  const confirm = async () => {
    if (key.current.version !== context.draft_version)
      key.current = {
        version: context.draft_version,
        value: crypto.randomUUID(),
      };
    const success = await controller.mutate(async (current, signal) => {
      await confirmDocumentation(current, key.current.value, signal);
      return getDocumentationContext(current.id, signal);
    });
    if (success) {
      setConfirmed(true);
      setAcknowledged(false);
      void revisions.refetch();
    }
  };
  return (
    <div className="tw-space-y-5">
      <DocumentationButton secondary onClick={() => setPreview(!preview)}>
        {preview ? msg("reviewAll") : msg("preview")}
      </DocumentationButton>
      {preview && (
        <DocumentationNotice>{msg("previewNotice")}</DocumentationNotice>
      )}
      {preview ? (
        <>
          {previewQuery.data ? (
            <DocumentationSummary
              context={previewQuery.data}
              profile={context.profile}
            />
          ) : (
            <DocumentationNotice error={previewQuery.isError}>
              {msg(previewQuery.isError ? "error" : "loading")}
            </DocumentationNotice>
          )}
        </>
      ) : (
        <DocumentationSummary context={context} />
      )}
      {!preview && (
        <>
          <section className={`${panelClass} tw-space-y-4`}>
            <h3 className="tw-m-0 tw-text-lg tw-font-semibold">
              {msg("confirm")}
            </h3>
            {confirmed && (
              <DocumentationNotice>
                {msg("confirmed")} · {msg("reviewPending")}
              </DocumentationNotice>
            )}
            {missing.length > 0 && (
              <div>
                <p className="tw-text-sm tw-text-iron-300">
                  {msg("confirmMissing")}
                </p>
                <ul className="tw-space-y-1 tw-pl-5 tw-text-sm tw-text-iron-300">
                  {missing.map((path) => (
                    <li key={path}>
                      {documentationFieldLabel(path.split(".").at(-1) ?? path)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!context.capabilities.confirm_as_artist && (
              <p className="tw-text-sm tw-text-iron-400">
                {msg("confirmArtist")}
              </p>
            )}
            <p className="tw-text-sm tw-leading-relaxed tw-text-iron-200">
              {msg("confirmCopy")}
            </p>
            <p className="tw-text-sm tw-leading-relaxed tw-text-iron-400">
              {msg("confirmHelp")}
            </p>
            <label className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-text-iron-200">
              <input
                type="checkbox"
                className="tw-mt-1 tw-h-5 tw-w-5 tw-shrink-0 tw-accent-primary-400"
                checked={acknowledged}
                disabled={!canConfirm}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              {msg("acknowledge")}
            </label>
            <DocumentationButton
              disabled={!canConfirm || !acknowledged}
              onClick={() => {
                void confirm();
              }}
            >
              {msg("confirm")}
            </DocumentationButton>
          </section>
          {context.latest_revision_id && (
            <DocumentationLaneReviews
              context={context}
              controller={controller}
            />
          )}
          <section className={panelClass}>
            <h3 className="tw-mb-4 tw-text-lg tw-font-semibold">
              {msg("history")}
            </h3>
            {(revisions.data?.data.length ?? 0) === 0 && (
              <p className="tw-text-sm tw-text-iron-400">{msg("noHistory")}</p>
            )}
            <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
              {revisions.data?.data.map((revision) => (
                <li key={revision.id}>
                  <Link
                    href={`${documentationWorkspacePath(context.work_id, context.id)}/revisions/${revision.id}`}
                    className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-text-sm tw-text-primary-300"
                  >
                    {msg("revision", { number: revision.revision_number })} ·{" "}
                    {formatDate(locale, revision.created_at)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function DocumentationLaneReviews({
  context,
  controller,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
}) {
  const { msg } = useDocumentationMessages();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const decide = async (lane: string, status: string, version: number) => {
    if (!context.latest_revision_id) return;
    const reason = reasons[lane] ?? "";
    setBusy(true);
    setError(false);
    try {
      await reviewDocumentationRevision(
        context.id,
        context.latest_revision_id,
        lane,
        { status, reason, expected_review_version: version }
      );
      await controller.mutate((current, signal) =>
        getDocumentationContext(current.id, signal)
      );
      setReasons((current) => ({
        ...current,
        [lane]: current[lane] === reason ? "" : (current[lane] ?? ""),
      }));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={`${panelClass} tw-space-y-4`}>
      <p className="tw-text-sm tw-text-iron-400">{msg("reviewScope")}</p>
      {error && <DocumentationNotice error>{msg("error")}</DocumentationNotice>}
      {context.profile.review_lanes.map((lane) => {
        const reason = reasons[lane] ?? "";
        const review = context.reviews.find(
          (item) => String(item.lane) === String(lane)
        );
        return (
          <div
            key={lane}
            className="tw-border-b tw-border-solid tw-border-iron-800 tw-pb-4"
          >
            <h3 className="tw-text-base tw-font-semibold">
              {msg(`lane.${lane}`)}
            </h3>
            <p className="tw-text-sm tw-text-iron-300">
              {msg(`review.${review?.status ?? "pending"}`)}
            </p>
            {review?.reason && (
              <p className="tw-whitespace-pre-wrap tw-text-sm tw-text-iron-300">
                {review.reason}
              </p>
            )}
            {context.capabilities.review_lanes.some(
              (allowed) => String(allowed) === String(lane)
            ) && (
              <div className="tw-space-y-3">
                <label className="tw-block tw-text-sm tw-text-iron-300">
                  {msg("reviewReason")}
                  <textarea
                    rows={3}
                    className={`${inputClass} tw-mt-2`}
                    value={reason}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [lane]: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="tw-flex tw-flex-wrap tw-gap-3">
                  <DocumentationButton
                    disabled={
                      busy ||
                      context.confirmation_status !==
                        ApiArtworkDocumentationContextConfirmationStatusEnum.Current
                    }
                    onClick={() => {
                      void decide(
                        lane,
                        "accepted",
                        review?.review_version ?? 0
                      );
                    }}
                  >
                    {msg("accept")}
                  </DocumentationButton>
                  <DocumentationButton
                    secondary
                    disabled={busy || !reason.trim()}
                    onClick={() => {
                      void decide(
                        lane,
                        "changes_requested",
                        review?.review_version ?? 0
                      );
                    }}
                  >
                    {msg("requestChanges")}
                  </DocumentationButton>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
