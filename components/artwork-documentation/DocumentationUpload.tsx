"use client";

import {
  canWriteDocumentationAssetRole,
  mutationCapabilities,
} from "@/lib/artwork-documentation/capabilities";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiArtworkDocumentationContextLifecycleEnum,
  type ApiArtworkDocumentationContext,
} from "@/generated/models/ApiArtworkDocumentationContext";
import { ApiArtworkDocumentationCapabilitiesEditModulesEnum } from "@/generated/models/ApiArtworkDocumentationCapabilities";
import type { ApiArtworkDocumentationUploadSession } from "@/generated/models/ApiArtworkDocumentationUploadSession";
import type { ApiArtworkDocumentationAssetLinkRequest } from "@/generated/models/ApiArtworkDocumentationAssetLinkRequest";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { transferDocumentationFile } from "@/lib/artwork-documentation/upload";
import {
  cancelDocumentationUpload,
  downloadDocumentationAsset,
  getDocumentationUpload,
  linkDocumentationAsset,
} from "@/services/api/artwork-documentation-assets-api";
import { pollDocumentationProcessing } from "@/lib/artwork-documentation/poll-processing";
import { getDocumentationContext } from "@/services/api/artwork-documentation-api";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { formatNumber } from "@/i18n/format";
import { formatFileSizeLabel } from "@/lib/link-preview/filePreviewI18n";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";
import {
  canPublishDocumentationAsset,
  documentationAssetRoles,
} from "@/lib/artwork-documentation/asset-roles";
import { isPublicationOnly } from "@/lib/artwork-documentation/intake";
import {
  reportArtworkDocumentationUploadFailure,
  type DocumentationUploadStage,
} from "@/utils/monitoring/artworkDocumentationUploadMonitoring";

import {
  activeUploadStates,
  canContinueUpload,
  canUseUpload,
  getOrStartUpload,
  restrictedRoles,
  uploadActionMessage,
  uploadButtonDisabled,
  uploadFailureStatus,
  type UploadStatus,
} from "@/lib/artwork-documentation/upload-state";
import {
  DocumentationUploadAssets,
  DocumentationUploadFeedback,
} from "./DocumentationUploadPresentation";

interface Props {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
  readonly onPendingChange?: ((pending: boolean) => void) | undefined;
}

export default function DocumentationUpload({
  context,
  controller,
  onPendingChange,
}: Props) {
  const { msg, locale } = useDocumentationMessages();
  const publicationOnly = isPublicationOnly(context.profile);
  const [file, setFile] = useState<File | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<readonly File[]>([]);
  const [role, setRole] = useState<string>("artwork_final");
  const [visibility, setVisibility] = useState("restricted");
  const [session, setSession] =
    useState<ApiArtworkDocumentationUploadSession | null>(null);
  const [sent, setSent] = useState(0);
  const [attaching, setAttaching] = useState(false);
  const [completedFilename, setCompletedFilename] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const setUploadStatus = useCallback(
    (next: UploadStatus) => {
      setStatus(next);
      onPendingChange?.(activeUploadStates.has(next));
    },
    [onPendingChange]
  );
  const abort = useRef<AbortController | null>(null);
  const transferRunning = useRef(false);
  const monitoringAttempt = useRef<object>({});
  const queuedTransfer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const queuedFilesRef = useRef<readonly File[]>([]);
  const startKey = useRef(crypto.randomUUID());
  const [actionError, setActionError] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
      clearTimeout(queuedTransfer.current);
      onPendingChange?.(false);
    };
  }, [onPendingChange]);
  const sizeLabel = (size: number) => formatFileSizeLabel(size, locale) ?? "—";
  const busy = attaching || activeUploadStates.has(status);
  useEffect(() => {
    if (!busy) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy WebViews also require returnValue to protect an active transfer.
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- Retain beforeunload compatibility.
      event.returnValue = "";
    };
    globalThis.addEventListener("beforeunload", beforeUnload);
    return () => globalThis.removeEventListener("beforeunload", beforeUnload);
  }, [busy]);
  const roles = documentationAssetRoles(context);
  const rolePermitted =
    canPublishDocumentationAsset(context, role) &&
    canWriteDocumentationAssetRole(context, role);
  const transferPermitted = session
    ? session.can_mutate === true && canUseUpload(context, session.asset)
    : rolePermitted;
  const failureMessage =
    session && !transferPermitted ? "uploadBlockedRecovery" : "uploadFailed";
  const actionLabel = msg(uploadActionMessage(status, session !== null));
  const chosenVisibility = publicationOnly ? "public_record" : visibility;
  const uploadVisibility =
    !publicationOnly && restrictedRoles.has(role)
      ? "restricted"
      : chosenVisibility;
  const visibleAssets = context.assets.filter(
    (asset) =>
      !publicationOnly ||
      (asset.intended_visibility === "public_record" &&
        roles.some((allowedRole) => allowedRole === asset.role))
  );
  const roleLabel = (value: string) => {
    if (publicationOnly && value === "preservation_master")
      return msg("publicationMasterRole");
    if (publicationOnly && value === "process_evidence")
      return msg("publicationProcessRole");
    return documentationOptionLabel(value);
  };
  const canUpload =
    mutationCapabilities(context).edit_modules.includes(
      ApiArtworkDocumentationCapabilitiesEditModulesEnum.Files
    ) &&
    context.lifecycle === ApiArtworkDocumentationContextLifecycleEnum.Active;

  const attach = useCallback(
    async (
      assetId: string,
      assetRole: string,
      assetVisibility: string,
      filename: string,
      uploadSignal: AbortSignal,
      allowLink = true
    ) =>
      controller.mutateContent(async (current, signal) => {
        const requestAbort = new AbortController();
        const cancelRequest = () => requestAbort.abort();
        signal.addEventListener("abort", cancelRequest, { once: true });
        uploadSignal.addEventListener("abort", cancelRequest, { once: true });
        if (signal.aborted || uploadSignal.aborted) cancelRequest();
        try {
          // Read back before linking: the previous response may have been lost.
          const latest = await getDocumentationContext(
            current.id,
            requestAbort.signal
          );
          if (
            latest.asset_links.some(
              (link) => link.asset_id === assetId && link.role === assetRole
            )
          )
            return latest;
          if (!allowLink) throw new Error("UPLOAD_MUTATION_NOT_ALLOWED");
          if (
            !canUseUpload(latest, {
              role: assetRole,
              intended_visibility: assetVisibility,
            })
          )
            throw new Error("PUBLICATION_ASSET_ROLE_REQUIRED");
          return await linkDocumentationAsset(
            latest,
            {
              asset_id: assetId,
              role: assetRole,
              label: filename,
              description: "",
              intended_visibility: assetVisibility,
              source_of_asset: isPublicationOnly(latest.profile)
                ? "unknown"
                : "self",
              source_credit: "",
              derived_from_asset_ids: [],
              deposit_note: "",
              intended_terms: {
                kind: isPublicationOnly(latest.profile)
                  ? "unspecified"
                  : "private_deposit",
              },
            } as ApiArtworkDocumentationAssetLinkRequest,
            requestAbort.signal
          );
        } catch (error) {
          reportArtworkDocumentationUploadFailure(error, {
            stage: "attach",
            profileVersion: current.profile.version,
            assetState: "ready",
            attempt: monitoringAttempt.current,
          });
          throw error;
        } finally {
          signal.removeEventListener("abort", cancelRequest);
          uploadSignal.removeEventListener("abort", cancelRequest);
        }
      }),
    [controller]
  );
  const finishAttachment = useCallback(
    async (
      upload: ApiArtworkDocumentationUploadSession,
      signal: AbortSignal
    ) => {
      setAttaching(true);
      const attached = await attach(
        upload.asset.id,
        upload.asset.role,
        upload.asset.intended_visibility,
        upload.asset.filename,
        signal,
        upload.can_mutate === true
      );
      if (mounted.current) setAttaching(false);
      if (!canContinueUpload(signal, mounted)) return;
      if (!attached) {
        // Keep the checked original available. Retrying must not upload it again.
        setSession(upload);
        setUploadStatus("attach_failed");
        return;
      }
      setCompletedFilename(upload.asset.filename);
      const [next, ...remaining] = queuedFilesRef.current;
      queuedFilesRef.current = remaining;
      setFile(next ?? null);
      setQueuedFiles(remaining);
      setSession(null);
      setSent(0);
      startKey.current = crypto.randomUUID();
      if (fileInput.current) fileInput.current.value = "";
      setUploadStatus(next ? "queued" : "ready");
      return next;
    },
    [attach, setUploadStatus]
  );
  const verifyUpload = useCallback(
    async (
      upload: ApiArtworkDocumentationUploadSession,
      resumeId: string | undefined,
      signal: AbortSignal
    ) => {
      if (upload.can_mutate !== true)
        throw new Error("UPLOAD_MUTATION_NOT_ALLOWED");
      if (!canUseUpload(controller.snapshot().context, upload.asset)) {
        // Keep a resumed session intact: its permission may only need correcting.
        // A newly rejected reservation is forgotten only after cancellation succeeds.
        if (!resumeId) {
          await cancelDocumentationUpload(context.id, upload.upload_id, signal);
          if (!canContinueUpload(signal, mounted)) return;
          setSession(null);
          startKey.current = crypto.randomUUID();
        }
        throw new Error("PUBLICATION_ASSET_ROLE_REQUIRED");
      }
      return true;
    },
    [controller, context.id]
  );
  const handleUploadState = useCallback(
    async (
      upload: ApiArtworkDocumentationUploadSession,
      resumeId: string | undefined,
      signal: AbortSignal,
      onNext: (file: File) => void
    ): Promise<boolean> => {
      if (upload.asset.state === "ready") {
        const next = await finishAttachment(upload, signal);
        if (next)
          queuedTransfer.current = setTimeout(() => {
            if (mounted.current) onNext(next);
          }, 0);
        return true;
      }
      if (!(await verifyUpload(upload, resumeId, signal))) return true;
      if (upload.asset.state === "processing") {
        setUploadStatus("processing");
        return true;
      }
      if (
        ["failed", "quarantined", "expired", "cancelled"].includes(
          upload.asset.state
        )
      ) {
        setUploadStatus("failed");
        return true;
      }
      return false;
    },
    [finishAttachment, verifyUpload, setUploadStatus]
  );
  const run = useCallback(
    async function runUpload(
      resumeId?: string,
      selectedFile: File | null = file
    ) {
      if (
        (!selectedFile && !resumeId) ||
        (!resumeId && !rolePermitted) ||
        transferRunning.current
      )
        return;
      if (
        selectedFile &&
        selectedFile.size >
          (controller.snapshot().context.profile.limits["asset_bytes"] ??
            4294967296)
      ) {
        setUploadStatus("failed");
        return;
      }
      transferRunning.current = true;
      monitoringAttempt.current = {};
      let stage: DocumentationUploadStage = resumeId ? "check" : "reserve";
      const controllerAbort = new AbortController();
      abort.current = controllerAbort;
      setUploadStatus(resumeId ? "checking" : "uploading");
      setSent(0);
      setActionError(false);
      try {
        const upload = await getOrStartUpload({
          contextId: context.id,
          resumeId,
          file: selectedFile,
          role,
          visibility: uploadVisibility,
          key: startKey.current,
          signal: controllerAbort.signal,
        });
        if (!canContinueUpload(controllerAbort.signal, mounted)) return;
        setSession(upload);
        if (upload.asset.state === "ready") stage = "attach";
        if (
          await handleUploadState(
            upload,
            resumeId,
            controllerAbort.signal,
            (next) => {
              void runUpload(undefined, next);
            }
          )
        )
          return;
        if (!selectedFile) throw new Error("UPLOAD_FILE_REQUIRED");
        setUploadStatus("uploading");
        stage = "transfer";
        const completed = await transferDocumentationFile({
          contextId: context.id,
          session: upload,
          file: selectedFile,
          signal: controllerAbort.signal,
          onProgress: setSent,
        });
        if (!canContinueUpload(controllerAbort.signal, mounted)) return;
        setSession({ ...upload, asset: completed.asset });
        setUploadStatus("processing");
      } catch (error) {
        if (!canContinueUpload(controllerAbort.signal, mounted)) return;
        reportArtworkDocumentationUploadFailure(error, {
          stage,
          profileVersion: controller.snapshot().context.profile.version,
          attempt: monitoringAttempt.current,
        });
        setUploadStatus(uploadFailureStatus(error));
      } finally {
        transferRunning.current = false;
      }
    },
    [
      file,
      rolePermitted,
      controller,
      context.id,
      role,
      uploadVisibility,
      handleUploadState,
      setUploadStatus,
    ]
  );
  const cancel = async () => {
    if (session && (session.can_mutate !== true || !canUpload)) return;
    abort.current?.abort();
    clearTimeout(queuedTransfer.current);
    queuedFilesRef.current = [];
    setQueuedFiles([]);
    const controllerAbort = new AbortController();
    abort.current = controllerAbort;
    setUploadStatus("cancelling");
    setActionError(false);
    try {
      if (session)
        await cancelDocumentationUpload(
          context.id,
          session.upload_id,
          controllerAbort.signal
        );
      if (!canContinueUpload(controllerAbort.signal, mounted)) return;
      setUploadStatus("idle");
      setAttaching(false);
      setSent(0);
      setSession(null);
      startKey.current = crypto.randomUUID();
    } catch {
      if (canContinueUpload(controllerAbort.signal, mounted)) {
        setUploadStatus("failed");
        setActionError(true);
      }
    }
  };
  useEffect(() => {
    if (status !== "processing" || !session) return;
    return pollDocumentationProcessing({
      expiresAt: session.expires_at,
      onError: () => {
        reportArtworkDocumentationUploadFailure(
          new Error("UPLOAD_STATUS_CHECK_FAILED"),
          {
            stage: "check",
            profileVersion: context.profile.version,
            assetState: session.asset.state,
            attempt: monitoringAttempt.current,
          }
        );
        setUploadStatus("failed");
      },
      poll: async (signal) => {
        let result: ApiArtworkDocumentationUploadSession;
        try {
          result = await getDocumentationUpload(
            context.id,
            session.upload_id,
            signal
          );
        } catch (error) {
          reportArtworkDocumentationUploadFailure(error, {
            stage: "check",
            profileVersion: context.profile.version,
            assetState: session.asset.state,
            attempt: monitoringAttempt.current,
          });
          throw error;
        }
        if (signal.aborted) return false;
        if (result.asset.state === "ready") {
          const next = await finishAttachment(result, signal);
          if (next)
            queuedTransfer.current = setTimeout(() => {
              if (mounted.current) void run(undefined, next);
            }, 0);
          return false;
        }
        if (result.can_mutate !== true)
          throw new Error("UPLOAD_MUTATION_NOT_ALLOWED");
        if (
          ["failed", "quarantined", "expired", "cancelled"].includes(
            result.asset.state
          )
        ) {
          setUploadStatus("failed");
          return false;
        }
        return true;
      },
    });
  }, [
    status,
    session,
    context.id,
    context.profile.version,
    finishAttachment,
    run,
    setUploadStatus,
  ]);
  useEffect(() => {
    if (status === "processing") return;
    const restored = context.assets.find(
      (asset) => asset.state === "processing"
    );
    if (!restored) return;
    return pollDocumentationProcessing({
      expiresAt: restored.expires_at ?? Date.now() + 15 * 60_000,
      onError: () => setActionError(true),
      poll: async (signal) => {
        const result = await getDocumentationUpload(
          context.id,
          restored.id,
          signal
        );
        if (signal.aborted) return false;
        if (result.asset.state === "processing") return true;
        return !(await controller.mutateContent((current, currentSignal) =>
          getDocumentationContext(current.id, currentSignal)
        ));
      },
    });
  }, [context.assets, context.id, controller, status]);
  const download = async (
    assetId: string,
    variant: "original" | "c2pa_report" = "original"
  ) => {
    setActionError(false);
    try {
      const response = await downloadDocumentationAsset(
        context.id,
        assetId,
        variant
      );
      if (mounted.current)
        globalThis.open(response.url, "_blank", "noopener,noreferrer");
    } catch {
      if (mounted.current) setActionError(true);
    }
  };
  return (
    <section
      className="tw-min-w-0 tw-space-y-6 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      id="documentation-upload"
      tabIndex={-1}
      aria-labelledby="documentation-upload-title"
    >
      <h3
        id="documentation-upload-title"
        className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal"
      >
        {msg(canUpload ? "editorial.addFile" : "editorial.recordFiles")}
      </h3>
      {canUpload && (
        <p className="tw-m-0 tw-max-w-prose tw-text-sm tw-leading-7 tw-text-iron-300">
          {msg(publicationOnly ? "publicationUploadHelp" : "uploadHelp")}
        </p>
      )}
      {canUpload && (
        <div className="tw-max-w-prose tw-space-y-5">
          <label className="tw-block tw-text-sm tw-text-iron-300">
            {msg("uploadRole")}
            <select
              className={`${inputClass} tw-mt-2`}
              disabled={busy}
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                startKey.current = crypto.randomUUID();
              }}
            >
              {roles.map((value) => (
                <option
                  key={value}
                  value={value}
                  disabled={!canWriteDocumentationAssetRole(context, value)}
                >
                  {roleLabel(value)}
                </option>
              ))}
            </select>
          </label>
          {!publicationOnly && (
            <label className="tw-block tw-text-sm tw-text-iron-300">
              {msg("visibility")}
              <select
                className={`${inputClass} tw-mt-2`}
                disabled={busy || restrictedRoles.has(role)}
                value={restrictedRoles.has(role) ? "restricted" : visibility}
                onChange={(event) => setVisibility(event.target.value)}
              >
                <option value="restricted">{msg("restricted")}</option>
                <option value="public_record">{msg("publicIntent")}</option>
              </select>
            </label>
          )}
          {!rolePermitted && (
            <DocumentationNotice>
              {msg("publicationInterviewPermission")}
            </DocumentationNotice>
          )}
          <label className="tw-block tw-text-sm tw-text-iron-300">
            {msg("uploadSelect")}
            <input
              ref={fileInput}
              type="file"
              multiple={!session}
              className="tw-mt-3 tw-block tw-min-h-12 tw-w-full tw-max-w-full tw-text-sm tw-text-iron-300 file:tw-mr-4 file:tw-cursor-pointer file:tw-rounded-md file:tw-border-0 file:tw-bg-iron-800 file:tw-px-4 file:tw-py-3 file:tw-font-medium file:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
              disabled={
                busy ||
                session?.asset.state === "ready" ||
                session?.asset.state === "processing"
              }
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setSent(0);
                if (!session) setUploadStatus("idle");
                const queued = Array.from(event.target.files ?? []).slice(1);
                queuedFilesRef.current = queued;
                setQueuedFiles(queued);
                if (!session) startKey.current = crypto.randomUUID();
              }}
            />
          </label>
          {queuedFiles.length > 0 && (
            <div className="tw-space-y-2">
              <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                {msg("museum.uploadQueue", {
                  count: formatNumber(locale, queuedFiles.length + 1),
                })}
              </p>
              <ul className="tw-max-h-48 tw-space-y-2 tw-overflow-y-auto tw-pl-5 tw-text-sm tw-text-iron-400">
                {[file, ...queuedFiles]
                  .filter((item): item is File => item !== null)
                  .map((item, index) => (
                    <li
                      key={`${item.name}-${index}`}
                      className="tw-break-words"
                    >
                      {item.name}
                    </li>
                  ))}
              </ul>
              <p className="tw-m-0 tw-text-xs tw-leading-6 tw-text-iron-400">
                {msg("museum.uploadQueueHelp")}
              </p>
            </div>
          )}
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {msg("uploadLimit", {
              size: sizeLabel(
                context.profile.limits["asset_bytes"] ?? 4294967296
              ),
              remaining: sizeLabel(
                Math.max(
                  0,
                  (context.profile.limits[
                    "context_stored_and_reserved_bytes"
                  ] ?? 21474836480) -
                    context.assets.reduce(
                      (total, asset) => total + asset.size_bytes,
                      0
                    )
                )
              ),
            })}
          </p>
          <div className="tw-flex tw-flex-wrap tw-gap-3">
            <DocumentationButton
              disabled={uploadButtonDisabled(
                file,
                session?.asset.state,
                busy,
                transferPermitted,
                context.profile.limits["asset_bytes"] ?? 4294967296
              )}
              onClick={() => {
                void run(session?.upload_id);
              }}
            >
              {actionLabel}
            </DocumentationButton>
            {(busy || session !== null) && (
              <DocumentationButton
                secondary
                disabled={status === "cancelling" || attaching}
                onClick={() => {
                  void cancel();
                }}
              >
                {msg("uploadCancel")}
              </DocumentationButton>
            )}
          </div>
        </div>
      )}
      <DocumentationUploadFeedback
        status={status}
        attaching={attaching}
        selectedFilename={file?.name}
        total={file?.size ?? 0}
        sent={sent}
        completedFilename={completedFilename}
        failureMessage={failureMessage}
        actionError={actionError}
      />
      <DocumentationUploadAssets
        context={context}
        controller={controller}
        session={session}
        file={file}
        busy={busy}
        visibleAssets={visibleAssets}
        publicationOnly={publicationOnly}
        roleLabel={roleLabel}
        sizeLabel={sizeLabel}
        onDownload={download}
        onResume={run}
      />
    </section>
  );
}
