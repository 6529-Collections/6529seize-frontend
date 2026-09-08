import type { ApiDropVoteSummary } from "@/generated/models/ApiDropVoteSummary";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import {
  fetchDropVoteSummaryPreview,
  isLocalVotePreviewEnabled,
} from "@/services/api/drop-vote-preview-api";
import {
  getDropEndpointId,
  getNormalizedDropId,
} from "@/services/api/wave-drops-v2-helpers";

export async function fetchDropVoteSummaryByIdV2(
  dropId: string,
  signal?: AbortSignal
): Promise<ApiDropVoteSummary> {
  try {
    return await commonApiFetch<ApiDropVoteSummary>({
      endpoint: `v2/drops/${getDropEndpointId(getNormalizedDropId(dropId))}/vote-summary`,
      signal,
      errorMode: "structured",
    });
  } catch (error) {
    if (
      !isLocalVotePreviewEnabled() ||
      getStructuredApiErrorStatus(error) !== 404
    ) {
      throw error;
    }
    // A 404 alone cannot distinguish a missing endpoint from an inaccessible
    // drop. The preview's voter requests independently enforce read access.
    return fetchDropVoteSummaryPreview(dropId, signal);
  }
}
