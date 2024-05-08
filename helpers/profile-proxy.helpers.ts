import { ProfileProxyActionStatus } from "../entities/IProxy";
import { ProfileProxyAction } from "../generated/models/ProfileProxyAction";
import { Time } from "./time";

export const getProfileProxyActionStatus = (
  action: ProfileProxyAction
): ProfileProxyActionStatus => {
  const now = Time.currentMillis();
  if (action.rejected_at) {
    return ProfileProxyActionStatus.REJECTED;
  }

  if (action.revoked_at) {
    return ProfileProxyActionStatus.REVOKED;
  }

  if (action.end_time && action.end_time < now) {
    return ProfileProxyActionStatus.EXPIRED;
  }

  if (!action.accepted_at) {
    return ProfileProxyActionStatus.PENDING;
  }

  if (action.start_time > now) {
    return ProfileProxyActionStatus.NOT_STARTED;
  }

  return ProfileProxyActionStatus.ACTIVE;
};
