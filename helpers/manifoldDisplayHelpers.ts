import {
  capitalizeEveryWord,
  fromGWEI,
  numberWithCommas,
} from "@/helpers/Helpers";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

export function formatEditionSize(manifoldClaim: ManifoldClaim): string {
  if (manifoldClaim.isFinalized) {
    return numberWithCommas(manifoldClaim.total);
  } else {
    return `${numberWithCommas(manifoldClaim.total)} / ${numberWithCommas(manifoldClaim.totalMax)}`;
  }
}

export function formatClaimStatus(manifoldClaim: ManifoldClaim): string {
  if (manifoldClaim.isFinalized) {
    return manifoldClaim.remaining > 0 ? "Ended" : "Sold Out";
  } else {
    return capitalizeEveryWord(manifoldClaim.status);
  }
}

export function formatClaimCost(manifoldClaim: ManifoldClaim): string {
  const costWei = manifoldClaim.costWei ?? 0n;
  if (costWei > 0n) {
    return `${numberWithCommas(
      Math.round(fromGWEI(Number(costWei)) * 100000) / 100000
    )} ETH`;
  } else {
    return `N/A`;
  }
}
