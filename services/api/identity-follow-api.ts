import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";
import {
  identityFollow,
  personalChange,
} from "@/lib/personal-records/personal-record-changes";
import { ownerOfProfile } from "@/lib/personal-records/record-owners";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";

/** Every action a profile follow subscribes to (all but votes). */
const IDENTITY_FOLLOW_BODY: ApiIdentitySubscriptionActions = {
  actions: Object.values(ApiIdentitySubscriptionTargetAction).filter(
    (action) => action !== ApiIdentitySubscriptionTargetAction.DropVoted
  ),
};

/**
 * Follows or unfollows a profile by handle: today's subscriptions route, or
 * a `follow` record keyed by the profile's owner, as the records mode says.
 */
export const setIdentityFollowing = (
  handle: string,
  following: boolean
): Promise<void> =>
  savePersonalSetting({
    legacy: async () => {
      const request = {
        endpoint: `identities/${handle}/subscriptions`,
        body: IDENTITY_FOLLOW_BODY,
      };
      await (following
        ? commonApiPost<
            ApiIdentitySubscriptionActions,
            ApiIdentitySubscriptionActions
          >(request)
        : commonApiDeleteWithBody<
            ApiIdentitySubscriptionActions,
            ApiIdentitySubscriptionActions
          >(request));
    },
    change: async () =>
      personalChange({
        follows: [identityFollow(await ownerOfProfile(handle), following)],
      }),
    recordsResult: () => undefined,
  });
