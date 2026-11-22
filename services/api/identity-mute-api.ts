import type { ApiIdentityMuteState } from "@/generated/models/ApiIdentityMuteState";
import {
  flagItem,
  personalChange,
} from "@/lib/personal-records/personal-record-changes";
import { ownerOfProfile } from "@/lib/personal-records/record-owners";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";

/**
 * Mutes or unmutes a profile (handle, wallet or id): today's mute route,
 * or a private `mute` item keyed by the profile's owner.
 */
export const setIdentityMuted = (
  identityKey: string,
  muted: boolean
): Promise<ApiIdentityMuteState> => {
  const endpoint = `/identities/${encodeURIComponent(identityKey)}/mute`;
  return savePersonalSetting({
    legacy: async () => {
      if (muted) {
        return await commonApiPost<undefined, ApiIdentityMuteState>({
          endpoint,
          body: undefined,
        });
      }
      await commonApiDelete({ endpoint });
      return { muted: false };
    },
    change: async () =>
      personalChange({
        items: [flagItem("mute", await ownerOfProfile(identityKey), muted)],
      }),
    recordsResult: () => ({ muted }),
  });
};
