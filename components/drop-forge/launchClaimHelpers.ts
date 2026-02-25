import { getClaimSeason } from "@/components/drop-forge/claimTraitsData";
import type { MintingClaim } from "@/generated/models/MintingClaim";

export function isMissingRequiredLaunchInfo(claim: MintingClaim): boolean {
  const noImageLocation = !claim.image_location?.trim();
  const noMetadataLocation = !claim.metadata_location?.trim();
  const noSeason = getClaimSeason(claim).trim() === "";
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
    !!claim.animation_url && !claim.animation_location?.trim();

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
