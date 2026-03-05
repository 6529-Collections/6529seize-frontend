import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { amIUser } from "@/helpers/Helpers";

export type RepDirection = "received" | "given";

export function getContributorLabel(
  direction: RepDirection,
  count: number
): string {
  if (direction === "given") {
    return count === 1 ? "receiver" : "receivers";
  }
  return count === 1 ? "rater" : "raters";
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

export function getCanEditNic({
  connectedProfile,
  targetProfile,
  activeProfileProxy,
  address,
}: {
  readonly connectedProfile: ApiIdentity | null;
  readonly targetProfile: ApiIdentity;
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly address: string | undefined;
}): boolean {
  if (!connectedProfile?.handle) return false;
  if (activeProfileProxy) {
    if (targetProfile.handle === activeProfileProxy.created_by.handle)
      return false;
    return activeProfileProxy.actions.some(
      (action) => action.action_type === ApiProfileProxyActionType.AllocateCic
    );
  }
  if (amIUser({ profile: targetProfile, address })) return false;
  return true;
}
