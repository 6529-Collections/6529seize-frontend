import { ProfileConnectedStatus } from "../entities/IProfile";
import { ProfileMinWithoutSubs } from "./ProfileTypes";
import { ApiIdentity } from "../generated/models/ApiIdentity";
export const getProfileConnectedStatus = ({
  profile,
  isProxy,
}: {
  readonly profile: ApiIdentity | null;
  readonly isProxy: boolean;
}): ProfileConnectedStatus => {
  if (!profile) {
    return ProfileConnectedStatus.NOT_CONNECTED;
  }
  if (isProxy) {
    return ProfileConnectedStatus.PROXY;
  }
  if (!profile.handle) {
    return ProfileConnectedStatus.NO_PROFILE;
  }
  return ProfileConnectedStatus.HAVE_PROFILE;
};

export const profileAndConsolidationsToProfileMin = ({
  profile,
}: {
  readonly profile: ApiIdentity;
}): ProfileMinWithoutSubs | null =>
  profile?.id && profile?.handle
    ? {
        id: profile.id,
        handle: profile.handle,
        pfp: profile.pfp ?? null,
        banner1_color: profile.banner1 ?? null,
        banner2_color: profile.banner2 ?? null,
        cic: profile.cic,
        rep: profile.rep,
        tdh: profile.tdh,
        level: profile.level,
        archived: false,
        primary_address: profile.primary_wallet ?? null,
      }
    : null;
