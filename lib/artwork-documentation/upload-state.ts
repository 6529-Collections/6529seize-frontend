import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationUploadSession } from "@/generated/models/ApiArtworkDocumentationUploadSession";
import { canWriteDocumentationAssetRole } from "./capabilities";
import { canPublishDocumentationAsset } from "./asset-roles";
import { isPublicationOnly } from "./intake";
import { DocumentationFileChangedError } from "./upload";
import {
  getDocumentationUpload,
  startDocumentationUpload,
} from "@/services/api/artwork-documentation-assets-api";

export type UploadStatus =
  | "idle"
  | "queued"
  | "uploading"
  | "processing"
  | "checking"
  | "ready"
  | "attach_failed"
  | "cancelling"
  | "failed"
  | "changed";
export const activeUploadStates = new Set<UploadStatus>([
  "queued",
  "uploading",
  "processing",
  "checking",
  "cancelling",
]);

export const restrictedRoles = new Set([
  "consent_instrument",
  "rights_instrument",
  "camera_original",
  "working_file",
]);
export function canContinueUpload(
  signal: AbortSignal,
  mounted: { readonly current: boolean }
): boolean {
  // Both values can change while awaiting a transfer or attachment.
  return mounted.current && !signal.aborted;
}

export function canUseUpload(
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

export function uploadButtonDisabled(
  file: File | null,
  state: string | undefined,
  busy: boolean,
  permitted: boolean,
  limit: number
): boolean {
  if (!file && !["ready", "processing"].includes(state ?? "")) return true;
  return busy || !permitted || (file?.size ?? 0) > limit;
}

export function uploadActionMessage(
  status: UploadStatus,
  hasSession: boolean
): string {
  if (status === "attach_failed") return "uploadRetryAttachment";
  return hasSession ? "retry" : "uploadStart";
}
export function uploadFailureStatus(error: unknown): UploadStatus {
  return error instanceof DocumentationFileChangedError ? "changed" : "failed";
}
export async function getOrStartUpload({
  contextId,
  resumeId,
  file,
  role,
  visibility,
  key,
  signal,
}: {
  readonly contextId: string;
  readonly resumeId: string | undefined;
  readonly file: File | null;
  readonly role: string;
  readonly visibility: string;
  readonly key: string;
  readonly signal: AbortSignal;
}): Promise<ApiArtworkDocumentationUploadSession> {
  if (resumeId) return getDocumentationUpload(contextId, resumeId, signal);
  if (!file) throw new Error("UPLOAD_FILE_REQUIRED");
  return startDocumentationUpload(
    contextId,
    {
      filename: file.name,
      size_bytes: file.size,
      declared_mime: file.type || "application/octet-stream",
      role,
      intended_visibility: visibility,
    },
    key,
    signal
  );
}
