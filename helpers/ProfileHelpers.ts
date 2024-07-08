import {
  IProfileAndConsolidations,
  ProfileConnectedStatus,
} from "../entities/IProfile";
import { ProfileMin } from "../generated/models/ProfileMin";

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

export const profileAndConsolidationsToProfileMin = ({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}): ProfileMin | null =>
  profile.profile
    ? {
        id: profile.profile.external_id,
        handle: profile.profile.handle,
        pfp: profile.profile.pfp_url ?? null,
        banner1_color: profile.profile.banner_1 ?? null,
        banner2_color: profile.profile.banner_2 ?? null,
        cic: profile.cic.cic_rating,
        rep: profile.rep,
        tdh: profile.consolidation.tdh,
        level: profile.level,
        // TODO: add archived to ProfileMin
        archived: false,
      }
    : null;
