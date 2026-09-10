"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";
import DocumentationAssetDetails from "./DocumentationAssetDetails";
import { DOCUMENTATION_ASSET_ROLES } from "@/lib/artwork-documentation/asset-roles";

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

export default function DocumentationUpload({ context, controller }: Props) {
  const { msg, locale } = useDocumentationMessages();
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState<string>("artwork_final");
  const [visibility, setVisibility] = useState("restricted");
  const [session, setSession] =
    useState<ApiArtworkDocumentationUploadSession | null>(null);
  const [sent, setSent] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "failed" | "changed"
  >("idle");
  const abort = useRef<AbortController | null>(null);
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
  const sizeLabel = (size: number) =>
    `${formatNumber(locale, size / (1024 * 1024), { maximumFractionDigits: 1 })} MiB`;
  const busy = status === "uploading" || status === "processing";
  const canUpload =
    context.capabilities.edit_modules.includes(
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
      controller.mutate((current, signal) =>
        linkDocumentationAsset(
          current,
          {
            asset_id: assetId,
            role: assetRole,
            label: filename,
            description: "",
            intended_visibility: assetVisibility,
            source_of_asset: "self",
            source_credit: "",
            derived_from_asset_ids: [],
            deposit_note: "",
            intended_terms: { kind: "private_deposit" },
          } as ApiArtworkDocumentationAssetLinkRequest,
          signal
        )
      ),
    [controller]
  );
  const run = async (resumeId?: string) => {
    if (!file) return;
    const controllerAbort = new AbortController();
    abort.current = controllerAbort;
    setStatus("uploading");
    setActionError(false);
    try {
      const upload = resumeId
        ? await getDocumentationUpload(
            context.id,
            resumeId,
            controllerAbort.signal
          )
        : await startDocumentationUpload(
            context.id,
            {
              filename: file.name,
              size_bytes: file.size,
              declared_mime: file.type || "application/octet-stream",
              role,
              intended_visibility: restrictedRoles.has(role)
                ? "restricted"
                : visibility,
            },
            startKey.current,
            controllerAbort.signal
          );
      if (!canContinueUpload(controllerAbort.signal, mounted)) return;
      setSession(upload);
      await transferDocumentationFile({
        contextId: context.id,
        session: upload,
        file,
        signal: controllerAbort.signal,
        onProgress: setSent,
      });
      if (!canContinueUpload(controllerAbort.signal, mounted)) return;
      setStatus("processing");
    } catch (error) {
      if (canContinueUpload(controllerAbort.signal, mounted))
        setStatus(
          error instanceof DocumentationFileChangedError ? "changed" : "failed"
        );
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
        if (result.asset.state === "ready") {
          const attached = await attach(
            result.asset.id,
            result.asset.role,
            result.asset.intended_visibility,
            result.asset.filename
          );
          if (canContinueUpload(signal, mounted)) {
            setStatus(attached ? "idle" : "failed");
            setFile(null);
            setSession(null);
            startKey.current = crypto.randomUUID();
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
  }, [status, session, context.id, attach]);
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
  const download = async (assetId: string) => {
    setActionError(false);
    try {
      const response = await downloadDocumentationAsset(
        context.id,
        assetId,
        "original"
      );
      if (mounted.current)
        globalThis.open(response.url, "_blank", "noopener,noreferrer");
    } catch {
      if (mounted.current) setActionError(true);
    }
  };
  return (
    <section
      className={`${panelClass} tw-space-y-4`}
      aria-labelledby="documentation-upload-title"
    >
      <h3
        id="documentation-upload-title"
        className="tw-m-0 tw-text-lg tw-font-semibold"
      >
        {msg("upload")}
      </h3>
      <p className="tw-m-0 tw-text-sm tw-leading-relaxed tw-text-iron-300">
        {msg("uploadHelp")}
      </p>
      <p className="tw-m-0 tw-text-xs tw-leading-relaxed tw-text-iron-400">
        {msg("uploadPrivacy")}
      </p>
      {canUpload && (
        <div className="tw-space-y-4">
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
              {DOCUMENTATION_ASSET_ROLES.map((value) => (
                <option key={value} value={value}>
                  {documentationOptionLabel(value)}
                </option>
              ))}
            </select>
          </label>
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
          <label className="tw-block tw-text-sm tw-text-iron-300">
            {msg("uploadSelect")}
            <input
              type="file"
              className={`${inputClass} tw-mt-2`}
              disabled={busy}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                if (!session) startKey.current = crypto.randomUUID();
              }}
            />
          </label>
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
                file.size >
                  (context.profile.limits["asset_bytes"] ?? 4294967296)
              }
              onClick={() => {
                void run(session?.upload_id);
              }}
            >
              {session ? msg("retry") : msg("uploadStart")}
            </DocumentationButton>
            {busy && (
              <DocumentationButton
                secondary
                onClick={() => {
                  abort.current?.abort();
                  if (session)
                    void cancelDocumentationUpload(
                      context.id,
                      session.upload_id
                    ).catch(() => setActionError(true));
                  setStatus("idle");
                  setSession(null);
                  startKey.current = crypto.randomUUID();
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
          {msg(status === "changed" ? "uploadMismatch" : "uploadFailed")}
        </DocumentationNotice>
      )}
      {actionError && (
        <DocumentationNotice error>{msg("error")}</DocumentationNotice>
      )}
      <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
        {context.assets.map((asset) => (
          <li
            key={asset.id}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-4"
          >
            <p className="tw-m-0 tw-break-all tw-text-sm tw-font-medium">
              {asset.filename}
            </p>
            <p className="tw-my-2 tw-text-xs tw-text-iron-400">
              {documentationOptionLabel(asset.role)} ·{" "}
              {sizeLabel(asset.size_bytes)} ·{" "}
              {documentationOptionLabel(asset.state)}
            </p>
            {asset.state === "ready" && (
              <>
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
                  canUpload && (
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
                <details className="tw-mt-3 tw-text-xs tw-text-iron-400">
                  <summary className="tw-cursor-pointer tw-py-2">
                    {msg("fileDetails")}
                  </summary>
                  <p className="tw-break-all">
                    {msg("fileHash")}: {asset.sha256}
                  </p>
                </details>
              </>
            )}
            {asset.state === "ready" && canUpload && (
              <DocumentationAssetDetails
                context={context}
                assetId={asset.id}
                controller={controller}
              />
            )}
            {["created", "uploading"].includes(asset.state) && canUpload && (
              <>
                <p className="tw-text-xs tw-text-iron-400">
                  {msg("uploadReselect")}
                </p>
                <DocumentationButton
                  secondary
                  disabled={!file || busy}
                  onClick={() => {
                    void run(asset.id);
                  }}
                >
                  {msg("retry")}
                </DocumentationButton>
              </>
            )}
          </li>
        ))}
      </ul>
      {context.assets.length === 0 && (
        <p className="tw-text-sm tw-text-iron-400">{msg("noFiles")}</p>
      )}
    </section>
  );
}
