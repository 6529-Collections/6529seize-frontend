import type { ManifoldClaim } from "@/hooks/useManifoldClaim";
import {
  numberWithCommas,
  fromGWEI,
  capitalizeEveryWord,
} from "@/helpers/Helpers";

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
  if (manifoldClaim.cost > 0) {
    return `${numberWithCommas(
      Math.round(fromGWEI(manifoldClaim.cost) * 100000) / 100000
    )} ETH`;
  } else {
    return `N/A`;
  }
}