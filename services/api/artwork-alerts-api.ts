import type { ApiArtistArtworkAlert } from "@/generated/models/ApiArtistArtworkAlert";
import {
  flagItem,
  personalChange,
} from "@/lib/personal-records/personal-record-changes";
import { ownerOfProfile } from "@/lib/personal-records/record-owners";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";

/**
 * Turns artwork alerts for an artist (by handle) on or off: today's route,
 * or a private `art-alert` item keyed by the artist's owner.
 */
export const setArtworkAlert = (
  handle: string,
  enabled: boolean
): Promise<ApiArtistArtworkAlert> => {
  const endpoint = `identities/${encodeURIComponent(handle)}/artwork-alerts`;
  return savePersonalSetting({
    legacy: async () => {
      if (enabled) {
        return await commonApiPost<undefined, ApiArtistArtworkAlert>({
          endpoint,
          body: undefined,
        });
      }
      await commonApiDelete({ endpoint });
      return { enabled: false };
    },
    change: async () =>
      personalChange({
        items: [flagItem("art-alert", await ownerOfProfile(handle), enabled)],
      }),
    recordsResult: () => ({ enabled }),
  });
};
