import type { ApiArtworkDocumentationStartUpload } from "@/generated/models/ApiArtworkDocumentationStartUpload";
import type { ApiArtworkDocumentationUploadSession } from "@/generated/models/ApiArtworkDocumentationUploadSession";
import type { ApiArtworkDocumentationSignedPartsResponse } from "@/generated/models/ApiArtworkDocumentationSignedPartsResponse";
import type { ApiArtworkDocumentationCompletePart } from "@/generated/models/ApiArtworkDocumentationCompletePart";
import type { ApiArtworkDocumentationAssetResponse } from "@/generated/models/ApiArtworkDocumentationAssetResponse";
import type { ApiArtworkDocumentationDownloadResponse } from "@/generated/models/ApiArtworkDocumentationDownloadResponse";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationAssetLinkRequest } from "@/generated/models/ApiArtworkDocumentationAssetLinkRequest";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
  commonApiPatch,
} from "./common-api";
import {
  documentationContextPath,
  documentationHeaders,
} from "./artwork-documentation-api";

const uploadsPath = (contextId: string) =>
  `${documentationContextPath(contextId)}/assets/uploads`;

export const patchDocumentationAssetLink = (
  context: ApiArtworkDocumentationContext,
  linkId: string,
  body: unknown,
  signal?: AbortSignal,
  key?: string
) =>
  commonApiPatch<unknown, ApiArtworkDocumentationContext>({
    endpoint: `${documentationContextPath(context.id)}/asset-links/${encodeURIComponent(linkId)}`,
    body,
    headers: documentationHeaders(context.draft_version, key),
    signal,
    errorMode: "structured",
  });
export const startDocumentationUpload = (
  contextId: string,
  body: ApiArtworkDocumentationStartUpload,
  key: string,
  signal?: AbortSignal
) =>
  commonApiPost<
    ApiArtworkDocumentationStartUpload,
    ApiArtworkDocumentationUploadSession
  >({
    endpoint: uploadsPath(contextId),
    body,
    headers: documentationHeaders(undefined, key),
    signal,
    errorMode: "structured",
  });
export const getDocumentationUpload = (
  contextId: string,
  uploadId: string,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiArtworkDocumentationUploadSession>({
    endpoint: `${uploadsPath(contextId)}/${encodeURIComponent(uploadId)}`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const signDocumentationParts = (
  contextId: string,
  uploadId: string,
  parts: Array<{ part_number: number; checksum_sha256: string }>,
  signal?: AbortSignal
) =>
  commonApiPost<unknown, ApiArtworkDocumentationSignedPartsResponse>({
    endpoint: `${uploadsPath(contextId)}/${encodeURIComponent(uploadId)}/parts`,
    body: { parts },
    headers: documentationHeaders(),
    signal,
    errorMode: "structured",
  });
export const completeDocumentationUpload = (
  contextId: string,
  uploadId: string,
  parts: ApiArtworkDocumentationCompletePart[],
  key: string,
  signal?: AbortSignal
) =>
  commonApiPost<unknown, ApiArtworkDocumentationAssetResponse>({
    endpoint: `${uploadsPath(contextId)}/${encodeURIComponent(uploadId)}/complete`,
    body: { parts },
    headers: documentationHeaders(undefined, key),
    signal,
    errorMode: "structured",
  });
export const cancelDocumentationUpload = (
  contextId: string,
  uploadId: string,
  signal?: AbortSignal
) =>
  commonApiDelete({
    endpoint: `${uploadsPath(contextId)}/${encodeURIComponent(uploadId)}`,
    headers: documentationHeaders(),
    signal,
    errorMode: "structured",
  });
export const linkDocumentationAsset = (
  context: ApiArtworkDocumentationContext,
  body: ApiArtworkDocumentationAssetLinkRequest,
  signal?: AbortSignal
) =>
  commonApiPost<
    ApiArtworkDocumentationAssetLinkRequest,
    ApiArtworkDocumentationContext
  >({
    endpoint: `${documentationContextPath(context.id)}/asset-links`,
    body,
    headers: documentationHeaders(context.draft_version),
    signal,
    errorMode: "structured",
  });
export const downloadDocumentationAsset = (
  contextId: string,
  assetId: string,
  variant: "original" | "preview",
  signal?: AbortSignal
) =>
  commonApiPost<unknown, ApiArtworkDocumentationDownloadResponse>({
    endpoint: `${documentationContextPath(contextId)}/assets/${encodeURIComponent(assetId)}/download`,
    body: { variant },
    headers: documentationHeaders(),
    signal,
    errorMode: "structured",
  });
