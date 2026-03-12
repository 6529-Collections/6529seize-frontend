import { ProfileConnectedStatus } from "@/entities/IProfile";
import type { ProfileMinWithoutSubs } from "./ProfileTypes";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";

type ProfileIdentityForOwnership =
  | Pick<ApiIdentity, "normalised_handle" | "wallets">
  | null
  | undefined;

type ProfileViewerContext = "self" | "other" | "anonymous";

const normalizeProfileTarget = (
  handleOrWallet: string | null | undefined
): string | null => {
  if (typeof handleOrWallet !== "string") {
    return null;
  }

  const normalizedTarget = handleOrWallet.trim().toLowerCase();
  return normalizedTarget.length > 0 ? normalizedTarget : null;
};

export const isOwnProfileRoute = ({
  connectedProfile,
  handleOrWallet,
}: {
  readonly connectedProfile: ProfileIdentityForOwnership;
  readonly handleOrWallet: string | null | undefined;
}): boolean => {
  const normalizedTarget = normalizeProfileTarget(handleOrWallet);
  if (!connectedProfile || !normalizedTarget) {
    return false;
  }

  if (connectedProfile.normalised_handle?.toLowerCase() === normalizedTarget) {
    return true;
  }

  return (
    connectedProfile.wallets?.some(
      (wallet) => wallet.wallet.toLowerCase() === normalizedTarget
    ) ?? false
  );
};

export const getProfileViewerContext = ({
  connectedProfile,
  handleOrWallet,
}: {
  readonly connectedProfile: ProfileIdentityForOwnership;
  readonly handleOrWallet: string | null | undefined;
}): ProfileViewerContext | null => {
  const normalizedTarget = normalizeProfileTarget(handleOrWallet);
  if (!normalizedTarget) {
    return null;
  }

  if (!connectedProfile) {
    return "anonymous";
  }

  return isOwnProfileRoute({
    connectedProfile,
    handleOrWallet: normalizedTarget,
  })
    ? "self"
    : "other";
};

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
  profile.id && profile.handle
    ? (() => {
        return {
          id: profile.id,
          active_main_stage_submission_ids:
            profile.active_main_stage_submission_ids,
          winner_main_stage_drop_ids: profile.winner_main_stage_drop_ids,
          handle: profile.handle,
          pfp: profile.pfp ?? null,
          banner1_color: getBannerColorValue(profile.banner1),
          banner2_color: getBannerColorValue(profile.banner2),
          cic: profile.cic,
          rep: profile.rep,
          tdh: profile.tdh,
          xtdh: profile.xtdh,
          tdh_rate: profile.tdh_rate,
          xtdh_rate: profile.xtdh_rate,
          level: profile.level,
          archived: false,
          primary_address: profile.primary_wallet,
          is_wave_creator: profile.is_wave_creator,
          artist_of_prevote_cards: profile.artist_of_prevote_cards,
        };
      })()
    : null;
