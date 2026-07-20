import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import type { ApiDropReactionV2 } from "@/generated/models/ApiDropReactionV2";
import { commonApiFetch } from "@/services/api/common-api";
import { mapIdentityOverviewToProfileMin } from "@/services/api/drop-v2-mappers";
import {
  getDropEndpointId,
  rethrowAbortFetchError,
} from "@/services/api/wave-drops-v2-helpers";

export const fetchDropReactionDetailsV2 = async (
  dropId: string,
  signal?: AbortSignal
): Promise<ApiDropReaction[]> => {
  const normalizedDropId = dropId.trim();
  if (!normalizedDropId) {
    return [];
  }

  try {
    const reactions = await commonApiFetch<ApiDropReactionV2[]>({
      endpoint: `v2/drops/${getDropEndpointId(normalizedDropId)}/reactions`,
      signal,
    });

    return reactions.map((reaction) => ({
      reaction: reaction.reaction,
      profiles: reaction.reactors.map(mapIdentityOverviewToProfileMin),
    }));
  } catch (error) {
    rethrowAbortFetchError(error);
    return [];
  }
};
