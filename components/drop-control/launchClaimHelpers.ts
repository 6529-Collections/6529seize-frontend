import type { MemeClaim } from "@/generated/models/MemeClaim";

export function isMissingRequiredLaunchInfo(claim: MemeClaim): boolean {
  const noImageLocation = !claim.image_location;
  const noMetadataLocation = !claim.metadata_location;
  const noSeason = claim.season == null;
  const noEditionSize = claim.edition_size == null;
  const noAttributes =
    !Array.isArray(claim.attributes) || claim.attributes.length === 0;
  const hasEmptyAttributeValue =
    Array.isArray(claim.attributes) &&
    claim.attributes.some((attribute) => {
      const value = attribute?.value;
      if (value == null) return true;
      if (typeof value === "string") return value.trim().length === 0;
      return false;
    });
  const animationRequiredButMissingLocation =
    !!claim.animation_url && !claim.animation_location;

  return (
    noImageLocation ||
    noMetadataLocation ||
    noSeason ||
    noEditionSize ||
    noAttributes ||
    hasEmptyAttributeValue ||
    animationRequiredButMissingLocation
  );
}
