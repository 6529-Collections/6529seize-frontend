"use client";

import { mutationCapabilities } from "@/lib/artwork-documentation/capabilities";

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
  PendingEdit,
} from "@/lib/artwork-documentation/draft-controller";
import { documentationDraftRecord } from "@/lib/artwork-documentation/record";
import { confirmationCopyMatches } from "@/lib/artwork-documentation/confirmation";
import {
  MODULE_IDS,
  type DocumentationSection,
} from "@/lib/artwork-documentation/registry";
import { documentationFieldSection } from "@/lib/artwork-documentation/catalogue";
import { useAuth } from "@/components/auth/Auth";
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
import DocumentationSaveStatus from "./DocumentationSaveStatus";
import DocumentationArtworkPreview from "./DocumentationArtworkPreview";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";

const EMPTY_EDITS: readonly PendingEdit[] = [];

export default function DocumentationReview({
  context,
  controller,
  saveState,
  edits = EMPTY_EDITS,
  onNavigateSection,
  onNavigateField,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
  readonly saveState: SaveState;
  readonly edits?: readonly PendingEdit[];
  readonly onNavigateSection: (section: DocumentationSection) => void;
  readonly onNavigateField?:
    | ((moduleId: string, fieldId: string) => void)
    | undefined;
}) {
  const { msg, locale } = useDocumentationMessages();
  const draftRecord = documentationDraftRecord(context, edits);
  const { connectedProfile, actorKey } = useDocumentationActor();
  const { requestAuth } = useAuth();
  const version = `${context.id}:${context.draft_version}`;
  const [acknowledgedVersion, setAcknowledgedVersion] = useState<string | null>(
    null
  );
  const acknowledged = acknowledgedVersion === version;
  const [preview, setPreview] = useState(false);
  const actionRunning = useRef(false);
  const [confirmationState, setConfirmationState] = useState<
    | "idle"
    | "confirming"
    | "unverified"
    | "checking"
    | "unconfirmed"
    | "needs_readback"
  >(() => {
    const snapshot = controller.snapshot();
    if (
      snapshot.context.confirmation_status ===
        ApiArtworkDocumentationContextConfirmationStatusEnum.Current &&
      snapshot.context.latest_revision_id
    )
      return "idle";
    return !snapshot.dirty &&
      ["invalid", "offline", "auth_expired", "conflict"].includes(
        snapshot.state
      )
      ? "needs_readback"
      : "idle";
  });
  const busy =
    confirmationState === "confirming" || confirmationState === "checking";
  const confirmed =
    context.confirmation_status ===
      ApiArtworkDocumentationContextConfirmationStatusEnum.Current &&
    !!context.latest_revision_id &&
    !controller.snapshot().dirty;
  const needsFreshReview = acknowledgedVersion !== null && !acknowledged;
  const key = useRef({
    version,
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
    (fieldModule) => fieldModule.completeness.missing
  );
  const needsInterviewPermission = context.issues.some(
    (issue) => issue.code === "INTERVIEW_PUBLICATION_PERMISSION_REQUIRED"
  );
  const canConfirm =
    mutationCapabilities(context).confirm_as_artist &&
    !confirmed &&
    (confirmationState === "idle" || confirmationState === "unconfirmed") &&
    !missing.length &&
    !needsInterviewPermission &&
    saveState === "clean" &&
    context.lifecycle === ApiArtworkDocumentationContextLifecycleEnum.Active &&
    confirmationCopyMatches(context.profile);
  const draftPreviewMessage =
    saveState === "clean"
      ? "editorial.savedRecordPreview"
      : "editorial.unsavedRecordPreview";
  const previewMessage = preview
    ? "editorial.savedPublicationPreview"
    : draftPreviewMessage;
  const confirm = async () => {
    if (
      actionRunning.current ||
      !canConfirm ||
      !acknowledged ||
      controller.snapshot().dirty
    )
      return;
    if (key.current.version !== version)
      key.current = {
        version,
        value: crypto.randomUUID(),
      };
    actionRunning.current = true;
    try {
      setConfirmationState("confirming");
      const submission = { attempted: false };
      const success = await controller.mutate(async (current, signal) => {
        // A queued save may finish after the click. Never attest to an unseen version.
        if (
          `${current.id}:${current.draft_version}` !== acknowledgedVersion ||
          controller.snapshot().dirty
        )
          return current;
        submission.attempted = true;
        await confirmDocumentation(current, key.current.value, signal);
        return getDocumentationContext(current.id, signal);
      });
      setAcknowledgedVersion(null);
      const saved = controller.snapshot().context;
      const verified =
        success &&
        saved.confirmation_status ===
          ApiArtworkDocumentationContextConfirmationStatusEnum.Current &&
        !!saved.latest_revision_id;
      setConfirmationState(
        submission.attempted && !verified ? "unverified" : "idle"
      );
      if (verified) void revisions.refetch();
    } finally {
      actionRunning.current = false;
    }
  };
  const checkConfirmation = async () => {
    if (actionRunning.current || controller.snapshot().state === "conflict")
      return;
    actionRunning.current = true;
    const uncertainConfirmation = confirmationState === "unverified";
    setAcknowledgedVersion(null);
    setConfirmationState("checking");
    let verified = false;
    try {
      if (controller.snapshot().state === "auth_expired") {
        const result = await requestAuth({ serverRejected: true });
        if (!result.success) return;
      }
      if (!(await controller.retry())) return;
      // Read back before offering another explicit confirmation. A failed response
      // does not tell us whether the earlier POST reached the server.
      verified = await controller.mutate((current, signal) =>
        getDocumentationContext(current.id, signal)
      );
      if (verified) void revisions.refetch();
    } catch {
      // Authentication recovery can reject before the controller handles a request.
      verified = false;
    } finally {
      actionRunning.current = false;
      const saved = controller.snapshot().context;
      if (!verified)
        setConfirmationState(
          uncertainConfirmation ? "unverified" : "needs_readback"
        );
      else if (
        saved.confirmation_status ===
          ApiArtworkDocumentationContextConfirmationStatusEnum.Current &&
        saved.latest_revision_id
      )
        setConfirmationState("idle");
      else setConfirmationState("unconfirmed");
    }
  };
  const navigateMissing = (path: string) => {
    const [moduleId, fieldId] = path.split(".");
    const fieldModule = MODULE_IDS.find((id) => id === moduleId);
    if (fieldModule && fieldId && onNavigateField)
      onNavigateField(fieldModule, fieldId);
    else if (fieldModule && fieldId)
      onNavigateSection(
        documentationFieldSection(context.profile, fieldModule, fieldId)
      );
  };
  return (
    <div className="tw-space-y-8">
      <DocumentationButton secondary onClick={() => setPreview(!preview)}>
        {msg(
          preview
            ? "editorial.returnToDraft"
            : "editorial.publicationPreviewAction"
        )}
      </DocumentationButton>
      <p
        role="status"
        className="tw-max-w-prose tw-text-sm tw-leading-7 tw-text-iron-400"
      >
        {msg(previewMessage)}
      </p>
      {preview ? (
        <>
          {previewQuery.data ? (
            <DocumentationSummary
              context={{ ...previewQuery.data, assets: context.assets }}
              profile={context.profile}
              media={
                <DocumentationArtworkPreview
                  context={context}
                  publication={previewQuery.data}
                />
              }
            />
          ) : (
            <DocumentationNotice error={previewQuery.isError}>
              {msg(previewQuery.isError ? "error" : "loading")}
            </DocumentationNotice>
          )}
        </>
      ) : (
        <DocumentationSummary
          context={draftRecord}
          media={<DocumentationArtworkPreview context={draftRecord} />}
        />
      )}
      {!preview && (
        <>
          <section className="tw-space-y-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-10">
            <h3 className="tw-m-0 tw-font-serif tw-text-3xl tw-font-normal">
              {msg("confirm")}
            </h3>
            {confirmed && context.latest_revision_id && (
              <DocumentationNotice>
                <p className="tw-m-0">{msg("confirmation.recorded")}</p>
                <Link
                  href={`${documentationWorkspacePath(context.work_id, context.id)}/revisions/${context.latest_revision_id}`}
                  className="tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-text-primary-300 tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                >
                  {msg("confirmation.viewRecorded")}
                </Link>
              </DocumentationNotice>
            )}
            {busy && (
              <p
                role="status"
                className="tw-text-sm tw-leading-7 tw-text-iron-300"
              >
                {msg(
                  confirmationState === "confirming"
                    ? "confirmation.sending"
                    : "confirmation.checking"
                )}
              </p>
            )}
            {!confirmed && confirmationState === "unconfirmed" && (
              <p
                role="status"
                className="tw-text-sm tw-leading-7 tw-text-iron-300"
              >
                {msg("confirmation.notRecorded")}
              </p>
            )}
            {!confirmed &&
              confirmationState === "needs_readback" &&
              saveState === "clean" && (
                <p
                  role="status"
                  className="tw-text-sm tw-leading-7 tw-text-iron-300"
                >
                  {msg("save.actionUnverified")}
                </p>
              )}
            {!confirmed && confirmationState === "unverified" && (
              <DocumentationNotice error>
                <p className="tw-m-0">{msg("confirmation.unverified")}</p>
              </DocumentationNotice>
            )}
            {saveState !== "clean" && !busy && (
              <DocumentationSaveStatus
                snapshot={controller.snapshot()}
                controller={controller}
                onNavigateSection={onNavigateSection}
                onNavigateField={onNavigateField}
              />
            )}
            {!confirmed &&
              (confirmationState === "unverified" ||
                confirmationState === "needs_readback" ||
                confirmationState === "checking") && (
                <DocumentationButton
                  secondary
                  disabled={busy || saveState === "conflict"}
                  onClick={() => {
                    void checkConfirmation();
                  }}
                >
                  {msg("confirmation.check")}
                </DocumentationButton>
              )}
            {needsFreshReview && !confirmed && (
              <p
                role="status"
                className="tw-text-sm tw-leading-7 tw-text-iron-300"
              >
                {msg("confirmation.reviewChanged")}
              </p>
            )}
            {needsInterviewPermission && (
              <div className="tw-max-w-prose tw-space-y-3">
                <p className="tw-text-sm tw-leading-7 tw-text-iron-300">
                  {msg("museum.interviewPermissionRequired")}
                </p>
                <div className="tw-flex tw-flex-wrap tw-gap-3">
                  <DocumentationButton
                    secondary
                    onClick={() => onNavigateSection("conversation")}
                  >
                    {msg("museum.chapter.conversation")}
                  </DocumentationButton>
                  <DocumentationButton
                    secondary
                    onClick={() => onNavigateSection("rights")}
                  >
                    {msg("museum.chapter.rights")}
                  </DocumentationButton>
                </div>
              </div>
            )}
            {missing.length > 0 && (
              <div>
                <p className="tw-text-sm tw-text-iron-300">
                  {msg("confirmMissing")}
                </p>
                <ul className="tw-space-y-1 tw-pl-5 tw-text-sm tw-text-iron-300">
                  {missing.map((path) => (
                    <li key={path}>
                      <button
                        type="button"
                        className="tw-min-h-11 tw-border-0 tw-bg-transparent tw-py-2 tw-text-left tw-text-primary-300 tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                        onClick={() => navigateMissing(path)}
                      >
                        {documentationFieldLabel(
                          path.split(".").at(-1) ?? path
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!mutationCapabilities(context).confirm_as_artist && (
              <p className="tw-text-sm tw-text-iron-400">
                {msg("confirmArtist")}
              </p>
            )}
            <p className="tw-text-sm tw-leading-relaxed tw-text-iron-200">
              {confirmationCopyMatches(context.profile)
                ? context.profile.confirmation_copy
                : msg("upgrade")}
            </p>
            <p className="tw-text-sm tw-leading-relaxed tw-text-iron-400">
              {msg("confirmHelp")}
            </p>
            {mutationCapabilities(context).confirm_as_artist && !confirmed && (
              <>
                <label className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-start tw-gap-3 tw-text-base tw-leading-7 tw-text-iron-200">
                  <input
                    type="checkbox"
                    className="tw-mt-1 tw-h-5 tw-w-5 tw-shrink-0 tw-accent-primary-400"
                    checked={acknowledged}
                    disabled={!canConfirm}
                    onChange={(event) =>
                      setAcknowledgedVersion(
                        event.target.checked ? version : null
                      )
                    }
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
              </>
            )}
          </section>
          {context.latest_revision_id && (
            <DocumentationLaneReviews
              context={context}
              controller={controller}
            />
          )}
          <section className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-10">
            <h3 className="tw-mb-4 tw-font-serif tw-text-3xl tw-font-normal">
              {msg("history")}
            </h3>
            {!context.latest_revision_id &&
              revisions.data?.data.length === 0 && (
                <p className="tw-text-sm tw-text-iron-400">
                  {msg("noHistory")}
                </p>
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
    <section className="tw-space-y-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-10">
      <p className="tw-text-sm tw-text-iron-400">{msg("reviewScope")}</p>
      {error && <DocumentationNotice error>{msg("error")}</DocumentationNotice>}
      {context.profile.review_lanes.map((lane) => {
        const reason = reasons[lane] ?? "";
        const review = context.reviews.find(
          (item) => String(item.lane) === String(lane)
        );
        return (
          <div key={lane} className="tw-space-y-3 tw-pb-4">
            <h3 className="tw-m-0 tw-text-base tw-font-medium">
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
            {mutationCapabilities(context).review_lanes.some(
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
