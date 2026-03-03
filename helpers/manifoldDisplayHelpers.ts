import { capitalizeEveryWord, numberWithCommas } from "@/helpers/Helpers";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

const WEI_PER_ETH = 1_000_000_000_000_000_000n;

function formatBigIntWithCommas(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatWeiToEth(wei: bigint, decimals = 5): string {
  if (wei <= 0n) {
    return "0";
  }
  const scale = BigInt(10) ** BigInt(decimals);
  const roundedScaled = (wei * scale + WEI_PER_ETH / 2n) / WEI_PER_ETH;
  const integerPart = roundedScaled / scale;
  const fractionalPart = roundedScaled % scale;
  const fractionalRaw = fractionalPart.toString().padStart(decimals, "0");
  const trimmedFractional = fractionalRaw.replace(/0+$/, "");
  if (!trimmedFractional) {
    return formatBigIntWithCommas(integerPart);
  }
  return `${formatBigIntWithCommas(integerPart)}.${trimmedFractional}`;
}

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
    return `${formatWeiToEth(costWei)} ETH`;
  } else {
    return `N/A`;
  }
}
