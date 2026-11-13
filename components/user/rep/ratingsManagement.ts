import { formatAddress } from "@/helpers/Helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";

// Management belongs to the connected owner. Existing proxy allocation flows
// keep their own permission checks and are not changed by this surface.
export function canManageGivenRatings(
  profile: ApiIdentity,
  connectedProfile: ApiIdentity | null,
  activeProfileProxy: ApiProfileProxy | null
): boolean {
  return (
    typeof profile.id === "string" &&
    profile.id.length > 0 &&
    !activeProfileProxy &&
    !!connectedProfile?.handle &&
    profile.id === connectedProfile.id
  );
}

export function isRatingValue(value: string): boolean {
  return /^-?\d+$/.test(value) && Number.isSafeInteger(Number(value));
}

/** Validate each prefix in release-before-spend order, including a negative budget. */
export function isWithinRatingAllowance(
  deltas: readonly number[],
  available: number
): boolean {
  let used = 0;
  for (const delta of deltas) {
    used += delta;
    if (!Number.isFinite(used) || used > available) return false;
  }
  return true;
}

export function getRatingRecipient(row: {
  readonly handle: string | null;
  readonly wallets: readonly string[];
  readonly profile_id: string;
}): { readonly identity: string; readonly display: string } {
  const handle = row.handle?.trim() ?? "";
  const identity = handle || (row.wallets[0] ?? row.profile_id);
  return { identity, display: handle || formatAddress(identity) };
}

export function withRatingRecipientIdentity(
  profile: ApiIdentity,
  identity: string
): ApiIdentity {
  return { ...profile, query: identity };
}
