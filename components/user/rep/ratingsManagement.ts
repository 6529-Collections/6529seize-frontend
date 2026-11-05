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
    !activeProfileProxy &&
    !!connectedProfile?.handle &&
    profile.id === connectedProfile.id
  );
}

export function isRatingValue(value: string): boolean {
  return /^-?\d+$/.test(value) && Number.isSafeInteger(Number(value));
}
