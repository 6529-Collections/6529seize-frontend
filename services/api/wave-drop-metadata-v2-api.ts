import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import { commonApiFetch } from "@/services/api/common-api";
import {
  getDropEndpointId,
  getNormalizedDropId,
  rethrowAbortFetchError,
} from "@/services/api/wave-drops-v2-helpers";

/** Keep priority fields authoritative when combining them with complete metadata. */
const mergeMetadata = (
  priorityMetadata: readonly ApiDropMetadataResponse[],
  metadata: readonly ApiDropMetadataResponse[]
): ApiDropMetadataResponse[] => {
  const priorityKeys = new Set(
    priorityMetadata.map((item) => item.data_key.trim()).filter(Boolean)
  );

  return [
    ...priorityMetadata,
    ...metadata.filter((item) => !priorityKeys.has(item.data_key.trim())),
  ];
};

/**
 * Hydrate full metadata while preserving priority fields and abort semantics.
 * Strict detail consumers opt into throwing failures so partial fallback data is not cached as complete.
 */
export const fetchDropMetadataByIdV2 = async ({
  dropId,
  headers,
  priorityMetadata = [],
  signal,
  throwOnError = false,
}: {
  readonly dropId: string;
  readonly headers?: Record<string, string> | undefined;
  readonly priorityMetadata?: readonly ApiDropMetadataResponse[] | undefined;
  readonly signal?: AbortSignal | undefined;
  readonly throwOnError?: boolean | undefined;
}): Promise<ApiDropMetadataResponse[]> => {
  try {
    const metadata = await commonApiFetch<ApiDropMetadataResponse[]>({
      endpoint: `v2/drops/${getDropEndpointId(getNormalizedDropId(dropId))}/metadata`,
      headers,
      signal,
    });
    return mergeMetadata(priorityMetadata, metadata);
  } catch (error) {
    rethrowAbortFetchError(error);
    if (throwOnError) {
      throw error;
    }
    return [...priorityMetadata];
  }
};
