import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export const getProfileRouteIdentity = (
  profile: ApiIdentity | null,
  address: string | undefined
): string | null =>
  profile?.normalised_handle ??
  profile?.handle ??
  profile?.primary_wallet.toLowerCase() ??
  address?.toLowerCase() ??
  null;

export const getProfileHref = (
  profile: ApiIdentity | null,
  address: string | undefined
): string => {
  const routeIdentity = getProfileRouteIdentity(profile, address);
  return routeIdentity ? `/${routeIdentity}` : "/";
};

export const isPublicWaveDropByProfile = (
  drop: ApiDrop,
  profile: ApiIdentity | null
): boolean => {
  const wave = drop.wave;
  return (
    !wave.visibility_group_id &&
    !wave.chat_group_id &&
    !wave.identity_wave &&
    isDropByConnectedProfile(drop, profile)
  );
};

export const hasEstablishedProfileActivity = (
  profile: ApiIdentity | null
): boolean => {
  if (!profile) {
    return false;
  }

  return (
    profile.is_wave_creator ||
    Boolean(profile.profile_wave_id) ||
    hasItems(profile.active_main_stage_submission_ids) ||
    hasItems(profile.winner_main_stage_drop_ids) ||
    hasItems(profile.artist_of_prevote_cards)
  );
};

const normalizeIdentityValue = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? null;

const isDropByConnectedProfile = (
  drop: ApiDrop,
  profile: ApiIdentity | null
): boolean => {
  if (!profile) {
    return false;
  }

  const expectedValues = new Set(
    [
      profile.id,
      profile.handle,
      profile.normalised_handle,
      profile.primary_wallet,
    ]
      .map(normalizeIdentityValue)
      .filter((value): value is string => Boolean(value))
  );

  return (
    expectedValues.has(normalizeIdentityValue(drop.author.id) ?? "") ||
    expectedValues.has(normalizeIdentityValue(drop.author.handle) ?? "") ||
    expectedValues.has(
      normalizeIdentityValue(drop.author.primary_address) ?? ""
    )
  );
};

const hasItems = (items: readonly unknown[] | null | undefined) =>
  Boolean(items?.length);
