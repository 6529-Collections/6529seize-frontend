"use client";

import {
  canEditDocumentationAsset,
  canWriteDocumentationAssetRole,
  mutationCapabilities,
} from "@/lib/artwork-documentation/capabilities";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { useDocumentationActor } from "./DocumentationAuthGate";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
import {
  ApiArtworkDocumentationContextLifecycleEnum,
  type ApiArtworkDocumentationContext,
} from "@/generated/models/ApiArtworkDocumentationContext";
import { ApiArtworkDocumentationCapabilitiesEditModulesEnum } from "@/generated/models/ApiArtworkDocumentationCapabilities";
import type { ApiArtworkDocumentationUploadSession } from "@/generated/models/ApiArtworkDocumentationUploadSession";
import type { ApiArtworkDocumentationAssetLinkRequest } from "@/generated/models/ApiArtworkDocumentationAssetLinkRequest";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  DocumentationFileChangedError,
  transferDocumentationFile,
} from "@/lib/artwork-documentation/upload";
import {
  cancelDocumentationUpload,
  downloadDocumentationAsset,
  getDocumentationUpload,
  linkDocumentationAsset,
  startDocumentationUpload,
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
import DocumentationAssetDetails from "./DocumentationAssetDetails";
import DocumentationMediaPlayer from "./DocumentationMediaPlayer";
import DocumentationAssetTechnical from "./DocumentationAssetTechnical";
import {
  canPublishDocumentationAsset,
  documentationAssetRoles,
} from "@/lib/artwork-documentation/asset-roles";
import { isPublicationOnly } from "@/lib/artwork-documentation/intake";

const restrictedRoles = new Set([
  "consent_instrument",
  "rights_instrument",
  "camera_original",
  "working_file",
]);
interface Props {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
}

function canContinueUpload(
  signal: AbortSignal,
  mounted: { readonly current: boolean }
): boolean {
  // Both values can change while awaiting a transfer or attachment.
  return mounted.current && !signal.aborted;
}

function canUseUpload(
  context: ApiArtworkDocumentationContext,
  asset: { readonly role: string; readonly intended_visibility: string }
): boolean {
  return (
    canPublishDocumentationAsset(context, asset.role) &&
    canWriteDocumentationAssetRole(context, asset.role) &&
    (!isPublicationOnly(context.profile) ||
      asset.intended_visibility === "public_record")
  );
}

export default function DocumentationUpload({ context, controller }: Props) {
  const { msg, locale } = useDocumentationMessages();
  const publicationOnly = isPublicationOnly(context.profile);
  const [file, setFile] = useState<File | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<readonly File[]>([]);
  const [role, setRole] = useState<string>("artwork_final");
  const [visibility, setVisibility] = useState("restricted");
  const [session, setSession] =
    useState<ApiArtworkDocumentationUploadSession | null>(null);
  const [sent, setSent] = useState(0);
  const [status, setStatus] = useState<
    | "idle"
    | "queued"
    | "uploading"
    | "processing"
    | "cancelling"
    | "failed"
    | "changed"
  >("idle");
  const abort = useRef<AbortController | null>(null);
  const transferRunning = useRef(false);
  const startKey = useRef(crypto.randomUUID());
  const [actionError, setActionError] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  const sizeLabel = (size: number) => formatFileSizeLabel(size, locale) ?? "—";
  const busy =
    status === "queued" ||
    status === "uploading" ||
    status === "processing" ||
    status === "cancelling";
  const roles = documentationAssetRoles(context);
  const rolePermitted =
    canPublishDocumentationAsset(context, role) &&
    canWriteDocumentationAssetRole(context, role);
  const transferPermitted = session
    ? session.can_mutate === true && canUseUpload(context, session.asset)
    : rolePermitted;
  const failureMessage =
    session && !transferPermitted ? "uploadBlockedRecovery" : "uploadFailed";
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
      filename: string
    ) =>
      controller.mutate((current, signal) => {
        if (
          !canUseUpload(current, {
            role: assetRole,
            intended_visibility: assetVisibility,
          })
        )
          throw new Error("PUBLICATION_ASSET_ROLE_REQUIRED");
        return linkDocumentationAsset(
          current,
          {
            asset_id: assetId,
            role: assetRole,
            label: filename,
            description: "",
            intended_visibility: assetVisibility,
            source_of_asset: isPublicationOnly(current.profile)
              ? "unknown"
              : "self",
            source_credit: "",
            derived_from_asset_ids: [],
            deposit_note: "",
            intended_terms: {
              kind: isPublicationOnly(current.profile)
                ? "unspecified"
                : "private_deposit",
            },
          } as ApiArtworkDocumentationAssetLinkRequest,
          signal
        );
      }),
    [controller]
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
  const run = useCallback(
    async (resumeId?: string, selectedFile: File | null = file) => {
      if (
        !selectedFile ||
        (!resumeId && !rolePermitted) ||
        transferRunning.current
      )
        return;
      if (
        selectedFile.size >
        (controller.snapshot().context.profile.limits["asset_bytes"] ??
          4294967296)
      ) {
        setStatus("failed");
        return;
      }
      transferRunning.current = true;
      const controllerAbort = new AbortController();
      abort.current = controllerAbort;
      setStatus("uploading");
      setActionError(false);
      try {
        if (!(await controller.flush())) {
          setStatus("idle");
          return;
        }
        const upload = resumeId
          ? await getDocumentationUpload(
              context.id,
              resumeId,
              controllerAbort.signal
            )
          : await startDocumentationUpload(
              context.id,
              {
                filename: selectedFile.name,
                size_bytes: selectedFile.size,
                declared_mime: selectedFile.type || "application/octet-stream",
                role,
                intended_visibility: uploadVisibility,
              },
              startKey.current,
              controllerAbort.signal
            );
        if (!canContinueUpload(controllerAbort.signal, mounted)) return;
        setSession(upload);
        if (!(await verifyUpload(upload, resumeId, controllerAbort.signal)))
          return;
        await transferDocumentationFile({
          contextId: context.id,
          session: upload,
          file: selectedFile,
          signal: controllerAbort.signal,
          onProgress: setSent,
        });
        if (!canContinueUpload(controllerAbort.signal, mounted)) return;
        setStatus("processing");
      } catch (error) {
        if (canContinueUpload(controllerAbort.signal, mounted))
          setStatus(
            error instanceof DocumentationFileChangedError
              ? "changed"
              : "failed"
          );
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
      verifyUpload,
    ]
  );
  const cancel = async () => {
    if (session && (session.can_mutate !== true || !canUpload)) return;
    abort.current?.abort();
    setQueuedFiles([]);
    const controllerAbort = new AbortController();
    abort.current = controllerAbort;
    setStatus("cancelling");
    setActionError(false);
    try {
      if (session)
        await cancelDocumentationUpload(
          context.id,
          session.upload_id,
          controllerAbort.signal
        );
      if (!canContinueUpload(controllerAbort.signal, mounted)) return;
      setStatus("idle");
      setSession(null);
      startKey.current = crypto.randomUUID();
    } catch {
      if (canContinueUpload(controllerAbort.signal, mounted)) {
        setStatus("failed");
        setActionError(true);
      }
    }
  };
  useEffect(() => {
    if (status !== "processing" || !session) return;
    return pollDocumentationProcessing({
      expiresAt: session.expires_at,
      onError: () => setStatus("failed"),
      poll: async (signal) => {
        const result = await getDocumentationUpload(
          context.id,
          session.upload_id,
          signal
        );
        if (signal.aborted) return false;
        if (result.can_mutate !== true)
          throw new Error("UPLOAD_MUTATION_NOT_ALLOWED");
        if (result.asset.state === "ready") {
          const attached = await attach(
            result.asset.id,
            result.asset.role,
            result.asset.intended_visibility,
            result.asset.filename
          );
          if (canContinueUpload(signal, mounted)) {
            const next = attached ? queuedFiles[0] : undefined;
            if (next) setStatus("queued");
            else setStatus(attached ? "idle" : "failed");
            setFile(next ?? null);
            if (attached) setQueuedFiles((files) => files.slice(1));
            setSession(null);
            startKey.current = crypto.randomUUID();
            if (next) void run(undefined, next);
          }
          return false;
        }
        if (
          ["failed", "quarantined", "expired", "cancelled"].includes(
            result.asset.state
          )
        ) {
          setStatus("failed");
          return false;
        }
        return true;
      },
    });
  }, [status, session, context.id, attach, queuedFiles, run]);
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
        return !(await controller.mutate((current, currentSignal) =>
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
      className="tw-min-w-0 tw-space-y-6"
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
              type="file"
              multiple={!session}
              className="tw-mt-3 tw-block tw-min-h-12 tw-w-full tw-max-w-full tw-text-sm tw-text-iron-300 file:tw-mr-4 file:tw-cursor-pointer file:tw-rounded-md file:tw-border-0 file:tw-bg-iron-800 file:tw-px-4 file:tw-py-3 file:tw-font-medium file:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
              disabled={busy}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setQueuedFiles(Array.from(event.target.files ?? []).slice(1));
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
              disabled={
                !file ||
                busy ||
                !transferPermitted ||
                file.size >
                  (context.profile.limits["asset_bytes"] ?? 4294967296)
              }
              onClick={() => {
                void run(session?.upload_id);
              }}
            >
              {session ? msg("retry") : msg("uploadStart")}
            </DocumentationButton>
            {(busy || session !== null) && (
              <DocumentationButton
                secondary
                disabled={status === "cancelling"}
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
      {status === "uploading" && (
        <div role="status">
          <progress
            className="tw-w-full"
            max={Math.max(1, file?.size ?? 0)}
            value={sent}
            aria-label={msg("uploadProgress", {
              sent: sizeLabel(sent),
              total: sizeLabel(file?.size ?? 0),
            })}
          />
          <p className="tw-mt-2 tw-text-xs tw-text-iron-300">
            {msg("uploadProgress", {
              sent: sizeLabel(sent),
              total: sizeLabel(file?.size ?? 0),
            })}
          </p>
        </div>
      )}
      {status === "processing" && (
        <DocumentationNotice>{msg("uploadProcessing")}</DocumentationNotice>
      )}
      {(status === "failed" || status === "changed") && (
        <DocumentationNotice error>
          {msg(status === "changed" ? "uploadMismatch" : failureMessage)}
        </DocumentationNotice>
      )}
      {actionError && (
        <DocumentationNotice error>{msg("error")}</DocumentationNotice>
      )}
      <ul className="tw-m-0 tw-list-none tw-p-0">
        {visibleAssets.map((asset) => (
          <DocumentationAssetMutationAccess
            key={asset.id}
            context={context}
            asset={asset}
            session={session}
          >
            {(canMutateAsset) => (
              <li className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-6">
                <p className="tw-m-0 tw-break-words tw-text-base tw-font-medium tw-leading-7">
                  {asset.filename}
                </p>
                <p className="tw-my-2 tw-text-xs tw-text-iron-400">
                  {roleLabel(asset.role)} · {sizeLabel(asset.size_bytes)} ·{" "}
                  {documentationOptionLabel(asset.state)}
                </p>
                {asset.state === "ready" && (
                  <>
                    <DocumentationMediaPlayer context={context} asset={asset} />
                    <div className="tw-flex tw-flex-wrap tw-gap-3">
                      <DocumentationButton
                        secondary
                        onClick={() => {
                          void download(asset.id);
                        }}
                      >
                        {msg("download")}
                      </DocumentationButton>
                      {!context.asset_links.some(
                        (link) => link.asset_id === asset.id
                      ) &&
                        canMutateAsset &&
                        canPublishDocumentationAsset(context, asset.role) && (
                          <DocumentationButton
                            secondary
                            onClick={() => {
                              void attach(
                                asset.id,
                                asset.role,
                                asset.intended_visibility,
                                asset.filename
                              );
                            }}
                          >
                            {msg("add")}
                          </DocumentationButton>
                        )}
                    </div>
                    <DocumentationAssetTechnical
                      contextId={context.id}
                      asset={asset}
                      canReadReport={context.capabilities.read_archival_files}
                      onReport={() => {
                        void download(asset.id, "c2pa_report");
                      }}
                    />
                  </>
                )}
                {asset.state === "ready" &&
                  canEditDocumentationAsset(context, asset.id) && (
                    <DocumentationAssetDetails
                      context={context}
                      assetId={asset.id}
                      controller={controller}
                    />
                  )}
                {["created", "uploading"].includes(asset.state) &&
                  canMutateAsset && (
                    <>
                      <p className="tw-text-xs tw-text-iron-400">
                        {msg("uploadReselect")}
                      </p>
                      <DocumentationButton
                        secondary
                        disabled={
                          !file ||
                          busy ||
                          (session !== null &&
                            session.upload_id !== asset.id) ||
                          !canPublishDocumentationAsset(context, asset.role)
                        }
                        onClick={() => {
                          void run(asset.id);
                        }}
                      >
                        {msg("retry")}
                      </DocumentationButton>
                    </>
                  )}
              </li>
            )}
          </DocumentationAssetMutationAccess>
        ))}
      </ul>
      {visibleAssets.length === 0 && (
        <p className="tw-text-sm tw-text-iron-400">
          {msg(publicationOnly ? "publicationNoFiles" : "noFiles")}
        </p>
      )}
    </section>
  );
}

function DocumentationAssetMutationAccess({
  context,
  asset,
  session,
  children,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly asset: ApiArtworkDocumentationAsset;
  readonly session: ApiArtworkDocumentationUploadSession | null;
  readonly children: (allowed: boolean) => ReactNode;
}) {
  const { connectedProfile, actorKey } = useDocumentationActor();
  const linked = context.asset_links.some((link) => link.asset_id === asset.id);
  const directlyAllowed =
    linked && canEditDocumentationAsset(context, asset.id);
  const mayRecover =
    canWriteDocumentationAssetRole(context, asset.role) && !linked;
  const knownUpload =
    session?.asset.id === asset.id && session.can_mutate === true;
  const recovery = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "upload-mutation-access",
      asset.id,
      actorKey,
      String(context.draft_version),
      JSON.stringify(mutationCapabilities(context))
    ),
    queryFn: ({ signal }) =>
      getDocumentationUpload(context.id, asset.id, signal),
    enabled: mayRecover && !knownUpload,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  // The upload endpoint checks the stored uploader and reference state using original grants.
  return children(
    directlyAllowed ||
      (mayRecover &&
        (knownUpload ||
          (recovery.data?.can_mutate === true && !recovery.isFetching)))
  );
}
