import {
  IProfileAndConsolidations,
  ProfileConnectedStatus,
} from "../entities/IProfile";

export const getProfileConnectedStatus = (
  profile: IProfileAndConsolidations | null
): ProfileConnectedStatus => {
  if (!profile) {
    return ProfileConnectedStatus.NOT_CONNECTED;
  }
  if (!profile.profile?.handle) {
    return ProfileConnectedStatus.NO_PROFILE;
  }
  return ProfileConnectedStatus.HAVE_PROFILE;
};
