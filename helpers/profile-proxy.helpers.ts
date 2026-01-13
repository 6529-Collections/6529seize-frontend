import { PROFILE_PROXY_ACCEPTANCE_COOKIE } from "@/constants/constants";
import { ProfileProxyActionStatus, ProfileProxySide } from "@/entities/IProxy";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import Cookies from "js-cookie";
import { assertUnreachable } from "./AllowlistToolHelpers";
import { Time } from "./time";

export const getProfileProxyActionStatus = ({
  action,
  side,
}: {
  action: ApiProfileProxyAction;
  side: ProfileProxySide;
}): ProfileProxyActionStatus => {
  switch (side) {
    case ProfileProxySide.GRANTED:
      if (action.revoked_at) {
        return ProfileProxyActionStatus.REVOKED;
      }
      return ProfileProxyActionStatus.ACTIVE;
    case ProfileProxySide.RECEIVED:
      if (action.rejected_at) {
        return ProfileProxyActionStatus.REJECTED;
      }
      if (action.accepted_at) {
        return ProfileProxyActionStatus.ACTIVE;
      }
      return ProfileProxyActionStatus.PENDING;
    default:
      assertUnreachable(side);
      return ProfileProxyActionStatus.PENDING;
  }
};

const getProxiesFiltered = ({
  profileProxies,
  onlyActive,
}: {
  readonly profileProxies: ApiProfileProxy[];
  readonly onlyActive: boolean;
}): ApiProfileProxy[] => {
  const now = Time.currentMillis();
  if (!onlyActive) {
    return profileProxies.filter((p) => !!p.actions.length);
  }
  return profileProxies
    .map((p) => ({
      ...p,
      actions: p.actions.filter((a) => {
        if (a.start_time && a.start_time > now) {
          return false;
        }
        if (a.end_time && a.end_time < now) {
          return false;
        }
        return a.is_active;
      }),
    }))
    .filter((p) => !!p.actions.length);
};

export const groupProfileProxies = ({
  onlyActive,
  profileProxies,
  profileId,
}: {
  readonly onlyActive: boolean;
  readonly profileProxies: ApiProfileProxy[];
  readonly profileId: string | null;
}): {
  readonly granted: ApiProfileProxy[];
  readonly received: ApiProfileProxy[];
} => {
  if (!profileProxies.length || !profileId)
    return { granted: [], received: [] };
  const profileProxiesFiltered = getProxiesFiltered({
    profileProxies,
    onlyActive,
  });
  return {
    granted: profileProxiesFiltered.filter(
      (p) => p.created_by.id === profileId
    ),
    received: profileProxiesFiltered
      .map((p) => ({
        ...p,
        actions: p.actions.filter((a) => !a.revoked_at),
      }))
      .filter((p) => p.granted_to.id === profileId && !!p.actions.length),
  };
};

const getProfileProxyActionAcceptanceModalKey = ({
  profileId,
}: {
  readonly profileId: string;
}): string => {
  return `${PROFILE_PROXY_ACCEPTANCE_COOKIE}-${profileId}`;
};

export const haveSeenProfileProxyActionAcceptanceModal = ({
  profileId,
}: {
  readonly profileId: string;
}): boolean => {
  return !!Cookies.get(getProfileProxyActionAcceptanceModalKey({ profileId }));
};

export const setSeenProfileProxyActionAcceptanceModal = ({
  profileId,
}: {
  readonly profileId: string;
}): void => {
  Cookies.set(
    getProfileProxyActionAcceptanceModalKey({ profileId }),
    `${Time.currentMillis()}`,
    { expires: 365 }
  );
};
