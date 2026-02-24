import type { RatingStats } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";

export function sortRepsByRatingAndContributors(items: RatingStats[]) {
  return [...items].sort((a, d) => {
    if (a.rating === d.rating) {
      return d.contributor_count - a.contributor_count;
    }
    return d.rating - a.rating;
  });
}

export function getCanEditRep({
  myProfile,
  targetProfile,
  activeProfileProxy,
}: {
  readonly myProfile: ApiIdentity | null;
  readonly targetProfile: ApiIdentity;
  readonly activeProfileProxy: ApiProfileProxy | null;
}) {
  if (!myProfile?.handle) {
    return false;
  }

  if (activeProfileProxy) {
    if (targetProfile.handle === activeProfileProxy.created_by.handle) {
      return false;
    }
    return activeProfileProxy.actions.some(
      (action) => action.action_type === ApiProfileProxyActionType.AllocateRep
    );
  }

  if (myProfile.handle === targetProfile.handle) {
    return false;
  }

  return true;
}
