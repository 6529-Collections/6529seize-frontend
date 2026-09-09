import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";
import type { ApiArtworkDocumentationOperation } from "@/generated/models/ApiArtworkDocumentationOperation";
import type { ApiArtworkDocumentationCreateWork } from "@/generated/models/ApiArtworkDocumentationCreateWork";
import type { ApiArtworkDocumentationProfilesResponse } from "@/generated/models/ApiArtworkDocumentationProfilesResponse";
import type { ApiArtworkDocumentationContextListResponse } from "@/generated/models/ApiArtworkDocumentationContextListResponse";
import type { ApiArtworkDocumentationRevision } from "@/generated/models/ApiArtworkDocumentationRevision";
import type { ApiArtworkDocumentationRevisionListResponse } from "@/generated/models/ApiArtworkDocumentationRevisionListResponse";
import type { ApiArtworkDocumentationThreadsResponse } from "@/generated/models/ApiArtworkDocumentationThreadsResponse";
import type { ApiArtworkDocumentationSourceImportPreview } from "@/generated/models/ApiArtworkDocumentationSourceImportPreview";
import type { ApiArtworkDocumentationGrantsResponse } from "@/generated/models/ApiArtworkDocumentationGrantsResponse";
import type { ApiArtworkDocumentationCreateContext } from "@/generated/models/ApiArtworkDocumentationCreateContext";
import type { ApiArtworkDocumentationPublicPreview } from "@/generated/models/ApiArtworkDocumentationPublicPreview";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPatch,
  commonApiPost,
  commonApiPut,
} from "./common-api";

const documentationEndpoint = "artwork-documentation";
export const documentationHeaders = (
  version?: number,
  key = crypto.randomUUID()
): Record<string, string> => ({
  "Idempotency-Key": key,
  ...(version === undefined ? {} : { "If-Match": `"draft-${version}"` }),
});
export const documentationContextPath = (id: string) =>
  `${documentationEndpoint}/contexts/${encodeURIComponent(id)}`;
export const getDocumentationPublicPreview = (
  id: string,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiArtworkDocumentationPublicPreview>({
    endpoint: `${documentationContextPath(id)}/public-preview`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const createAdditionalDocumentationContext = (
  workId: string,
  profile: ApiArtworkDocumentationProfile,
  key: string,
  signal?: AbortSignal
) =>
  commonApiPost<
    ApiArtworkDocumentationCreateContext,
    ApiArtworkDocumentationContext
  >({
    endpoint: `${documentationEndpoint}/works/${encodeURIComponent(workId)}/contexts`,
    body: {
      profile_id: profile.profile_id,
      profile_version: profile.version,
      ...(profile.program_id ? { program_id: profile.program_id } : {}),
      acknowledge_empty_context: true,
    },
    headers: documentationHeaders(undefined, key),
    signal,
    errorMode: "structured",
  });
export const documentationProfileKey = (
  profile: ApiArtworkDocumentationProfile
) =>
  JSON.stringify([
    profile.profile_id,
    profile.program_id ?? null,
    profile.wave_id ?? null,
    profile.version,
  ]);
export const documentationWorkspacePath = (workId: string, contextId: string) =>
  `/artwork-documentation/works/${encodeURIComponent(workId)}/contexts/${encodeURIComponent(contextId)}`;
export const getDocumentationProfiles = (signal?: AbortSignal) =>
  commonApiFetch<ApiArtworkDocumentationProfilesResponse>({
    endpoint: `${documentationEndpoint}/profiles`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const getDocumentationContext = (id: string, signal?: AbortSignal) =>
  commonApiFetch<ApiArtworkDocumentationContext>({
    endpoint: documentationContextPath(id),
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export type DocumentationQueueFilters = Partial<
  Record<
    | "confirmation_status"
    | "review_lane"
    | "outstanding_action"
    | "profile_id"
    | "profile_version",
    string
  >
>;
export const getDocumentationWorks = (
  cursor?: string,
  programId?: string,
  signal?: AbortSignal,
  filters: DocumentationQueueFilters = {}
) =>
  commonApiFetch<ApiArtworkDocumentationContextListResponse>({
    endpoint: programId
      ? `${documentationEndpoint}/programs/${encodeURIComponent(programId)}/contexts`
      : `${documentationEndpoint}/works`,
    params: {
      ...(programId
        ? Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value)
          )
        : { scope: "mine" }),
      ...(cursor ? { cursor } : {}),
    },
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const createDocumentationWork = (
  body: ApiArtworkDocumentationCreateWork,
  key = crypto.randomUUID(),
  signal?: AbortSignal
) =>
  commonApiPost<
    ApiArtworkDocumentationCreateWork,
    ApiArtworkDocumentationContext
  >({
    endpoint: `${documentationEndpoint}/works`,
    body,
    headers: documentationHeaders(undefined, key),
    signal,
    errorMode: "structured",
  });
export const patchDocumentationModule = (
  context: ApiArtworkDocumentationContext,
  moduleId: string,
  operations: ApiArtworkDocumentationOperation[],
  key: string,
  signal?: AbortSignal
) => {
  const replacement = operations.find(
    (operation) => "replacementReason" in operation
  ) as
    | (ApiArtworkDocumentationOperation & { replacementReason: string })
    | undefined;
  return commonApiPatch<unknown, ApiArtworkDocumentationContext>({
    endpoint: `${documentationContextPath(context.id)}/modules/${encodeURIComponent(moduleId)}`,
    body: {
      schema_version: 1,
      operations: operations.map(({ op, field, answer }) => ({
        op,
        field,
        ...(answer ? { answer } : {}),
      })),
      ...(replacement
        ? { replacement_reason: replacement.replacementReason }
        : {}),
      ...(moduleId === "identity"
        ? { expected_artist_record_version: context.artist_record_version }
        : {}),
    },
    headers: documentationHeaders(context.draft_version, key),
    signal,
    errorMode: "structured",
  });
};
export const associateDocumentationSource = (
  contextId: string,
  dropId: string,
  draftVersion: number,
  signal?: AbortSignal,
  key = crypto.randomUUID()
) =>
  commonApiPost<unknown, ApiArtworkDocumentationContext>({
    endpoint: `${documentationContextPath(contextId)}/source-links`,
    body: { drop_id: dropId },
    headers: documentationHeaders(draftVersion, key),
    signal,
    errorMode: "structured",
  });
export const getDocumentationRevisions = (id: string, signal?: AbortSignal) =>
  commonApiFetch<ApiArtworkDocumentationRevisionListResponse>({
    endpoint: `${documentationContextPath(id)}/revisions`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const getDocumentationRevision = (
  id: string,
  revisionId: string,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiArtworkDocumentationRevision>({
    endpoint: `${documentationContextPath(id)}/revisions/${encodeURIComponent(revisionId)}`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const confirmDocumentation = (
  context: ApiArtworkDocumentationContext,
  key: string,
  signal?: AbortSignal
) =>
  commonApiPost<unknown, ApiArtworkDocumentationRevision>({
    endpoint: `${documentationContextPath(context.id)}/confirmations`,
    body: {
      confirmation_copy_version: context.profile.confirmation_copy_version,
    },
    headers: documentationHeaders(context.draft_version, key),
    signal,
    errorMode: "structured",
  });
export const getDocumentationThreads = (id: string, signal?: AbortSignal) =>
  commonApiFetch<ApiArtworkDocumentationThreadsResponse>({
    endpoint: `${documentationContextPath(id)}/threads`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const createDocumentationThread = (
  id: string,
  body: unknown,
  signal?: AbortSignal
) =>
  commonApiPost<unknown, unknown>({
    endpoint: `${documentationContextPath(id)}/threads`,
    body,
    headers: documentationHeaders(),
    signal,
    errorMode: "structured",
  });
export const commentDocumentationThread = (
  id: string,
  threadId: string,
  text: string,
  signal?: AbortSignal
) =>
  commonApiPost<unknown, unknown>({
    endpoint: `${documentationContextPath(id)}/threads/${encodeURIComponent(threadId)}/comments`,
    body: { text },
    headers: documentationHeaders(),
    signal,
    errorMode: "structured",
  });
export const resolveDocumentationThread = (
  id: string,
  threadId: string,
  threadVersion: number,
  resolved: boolean,
  signal?: AbortSignal
) =>
  commonApiPatch<unknown, unknown>({
    endpoint: `${documentationContextPath(id)}/threads/${encodeURIComponent(threadId)}`,
    body: { expected_thread_version: threadVersion, resolved },
    headers: documentationHeaders(),
    signal,
    errorMode: "structured",
  });
export const reviewDocumentationRevision = (
  id: string,
  revisionId: string,
  lane: string,
  body: unknown,
  signal?: AbortSignal
) =>
  commonApiPut<unknown, unknown>({
    endpoint: `${documentationContextPath(id)}/revisions/${encodeURIComponent(revisionId)}/reviews/${encodeURIComponent(lane)}`,
    body,
    headers: documentationHeaders(),
    signal,
    errorMode: "structured",
  });
export const getDocumentationSourcePreview = (
  id: string,
  receiptId: string,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiArtworkDocumentationSourceImportPreview>({
    endpoint: `${documentationContextPath(id)}/source-imports/${encodeURIComponent(receiptId)}/preview`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const importDocumentationSource = (
  context: ApiArtworkDocumentationContext,
  receiptId: string,
  fields: Array<{ source_path: string; target_field: string }>,
  signal?: AbortSignal
) =>
  commonApiPost<unknown, ApiArtworkDocumentationContext>({
    endpoint: `${documentationContextPath(context.id)}/source-imports`,
    body: { source_receipt_id: receiptId, fields },
    headers: documentationHeaders(context.draft_version),
    signal,
    errorMode: "structured",
  });
export const getDocumentationGrants = (id: string, signal?: AbortSignal) =>
  commonApiFetch<ApiArtworkDocumentationGrantsResponse>({
    endpoint: `${documentationContextPath(id)}/grants`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const grantDocumentationAccess = (
  id: string,
  body: unknown,
  signal?: AbortSignal
) =>
  commonApiPost<unknown, unknown>({
    endpoint: `${documentationContextPath(id)}/grants`,
    body,
    headers: documentationHeaders(),
    signal,
    errorMode: "structured",
  });
export const revokeDocumentationAccess = (
  id: string,
  grantId: string,
  signal?: AbortSignal
) =>
  commonApiDelete({
    endpoint: `${documentationContextPath(id)}/grants/${encodeURIComponent(grantId)}`,
    headers: documentationHeaders(),
    signal,
    errorMode: "structured",
  });
export const changeDocumentationLifecycle = (
  context: ApiArtworkDocumentationContext,
  lifecycle: "active" | "archived",
  signal?: AbortSignal
) =>
  commonApiPatch<unknown, ApiArtworkDocumentationContext>({
    endpoint: documentationContextPath(context.id),
    body: { lifecycle },
    headers: documentationHeaders(context.draft_version),
    signal,
    errorMode: "structured",
  });
export const pinDocumentationArtistRecord = (
  context: ApiArtworkDocumentationContext,
  revisionId: string,
  signal?: AbortSignal
) =>
  commonApiPost<unknown, ApiArtworkDocumentationContext>({
    endpoint: `${documentationContextPath(context.id)}/artist-record-pin`,
    body: { artist_record_revision_id: revisionId },
    headers: documentationHeaders(context.draft_version),
    signal,
    errorMode: "structured",
  });
export function documentationErrorStatus(error: unknown): number | undefined {
  return error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : undefined;
}
