"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationUploadSession } from "@/generated/models/ApiArtworkDocumentationUploadSession";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import type { UploadStatus } from "@/lib/artwork-documentation/upload-state";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { formatFileSizeLabel } from "@/lib/link-preview/filePreviewI18n";
import { canPublishDocumentationAsset } from "@/lib/artwork-documentation/asset-roles";
import {
  canEditDocumentationAsset,
  canWriteDocumentationAssetRole,
  mutationCapabilities,
} from "@/lib/artwork-documentation/capabilities";
import { getDocumentationUpload } from "@/services/api/artwork-documentation-assets-api";
import { useDocumentationActor } from "./DocumentationAuthGate";
import {
  DocumentationButton,
  DocumentationNotice,
  useDocumentationMessages,
} from "./DocumentationControls";
import DocumentationAssetDetails from "./DocumentationAssetDetails";
import DocumentationMediaPlayer from "./DocumentationMediaPlayer";
import DocumentationAssetTechnical from "./DocumentationAssetTechnical";

export function DocumentationUploadAssets({
  context,
  controller,
  session,
  file,
  busy,
  visibleAssets,
  publicationOnly,
  roleLabel,
  sizeLabel,
  onDownload,
  onResume,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
  readonly session: ApiArtworkDocumentationUploadSession | null;
  readonly file: File | null;
  readonly busy: boolean;
  readonly visibleAssets: readonly ApiArtworkDocumentationAsset[];
  readonly publicationOnly: boolean;
  readonly roleLabel: (value: string) => string;
  readonly sizeLabel: (size: number) => string;
  readonly onDownload: (
    assetId: string,
    variant?: "original" | "c2pa_report"
  ) => Promise<void>;
  readonly onResume: (resumeId?: string) => Promise<void>;
}) {
  const { msg } = useDocumentationMessages();
  return (
    <>
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
                          void onDownload(asset.id);
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
                              void onResume(asset.id);
                            }}
                          >
                            {msg("uploadRetryAttachment")}
                          </DocumentationButton>
                        )}
                    </div>
                    <DocumentationAssetTechnical
                      contextId={context.id}
                      asset={asset}
                      canReadReport={context.capabilities.read_archival_files}
                      onReport={() => {
                        void onDownload(asset.id, "c2pa_report");
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
                          void onResume(asset.id);
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
    </>
  );
}

export function DocumentationUploadFeedback({
  status,
  attaching,
  selectedFilename,
  total,
  sent,
  completedFilename,
  failureMessage,
  actionError,
}: {
  readonly status: UploadStatus;
  readonly attaching: boolean;
  readonly selectedFilename: string | undefined;
  readonly total: number;
  readonly sent: number;
  readonly completedFilename: string;
  readonly failureMessage: string;
  readonly actionError: boolean;
}) {
  const { msg, locale } = useDocumentationMessages();
  const sizeLabel = (size: number) => formatFileSizeLabel(size, locale) ?? "—";
  return (
    <>
      {selectedFilename && status === "idle" && (
        <DocumentationNotice>
          {msg("uploadSelected", { filename: selectedFilename })}
        </DocumentationNotice>
      )}
      {status === "checking" && (
        <DocumentationNotice>{msg("uploadChecking")}</DocumentationNotice>
      )}
      {attaching && (
        <DocumentationNotice>{msg("uploadAttaching")}</DocumentationNotice>
      )}
      {status === "ready" && (
        <DocumentationNotice>
          {msg("uploadCompleted", { filename: completedFilename })}
        </DocumentationNotice>
      )}
      {status === "attach_failed" && (
        <DocumentationNotice error>
          {msg("uploadAttachmentFailed")}
        </DocumentationNotice>
      )}
      {status === "uploading" && !attaching && (
        <div role="status">
          <progress
            className="tw-w-full"
            max={Math.max(1, total)}
            value={sent}
            aria-label={msg("uploadProgress", {
              sent: sizeLabel(sent),
              total: sizeLabel(total),
            })}
          />
          <p className="tw-mt-2 tw-text-xs tw-text-iron-300">
            {msg("uploadProgress", {
              sent: sizeLabel(sent),
              total: sizeLabel(total),
            })}
          </p>
        </div>
      )}
      {status === "processing" && !attaching && (
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
    </>
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
