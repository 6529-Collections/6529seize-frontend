import { capitalizeEveryWord, numberWithCommas } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

const WEI_PER_ETH = 1_000_000_000_000_000_000n;

function formatBigIntWithCommas(value: bigint): string {
  const digits = value.toString();
  const length = digits.length;

  if (length <= 3) {
    return digits;
  }

  let grouped = "";
  const firstGroupLength = length % 3 || 3;
  grouped += digits.slice(0, firstGroupLength);

  for (let index = firstGroupLength; index < length; index += 3) {
    grouped += `,${digits.slice(index, index + 3)}`;
  }

  return grouped;
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
  let trimmedLength = fractionalRaw.length;

  while (
    trimmedLength > 0 &&
    fractionalRaw.codePointAt(trimmedLength - 1) === 48
  ) {
    trimmedLength -= 1;
  }

  const trimmedFractional = fractionalRaw.slice(0, trimmedLength);
  if (!trimmedFractional) {
    return formatBigIntWithCommas(integerPart);
  }
  return `${formatBigIntWithCommas(integerPart)}.${trimmedFractional}`;
}

export function formatEditionSize(manifoldClaim: ManifoldClaim): string {
  if (manifoldClaim.isDropComplete) {
    return numberWithCommas(manifoldClaim.total);
  } else {
    return `${numberWithCommas(manifoldClaim.total)} / ${numberWithCommas(manifoldClaim.totalMax)}`;
  }
}

export function formatClaimStatus(manifoldClaim: ManifoldClaim): string {
  if (manifoldClaim.isDropComplete) {
    return manifoldClaim.remaining > 0 ? "Ended" : "Sold Out";
  }

  if (manifoldClaim.isFinalized && manifoldClaim.nextMemePhase) {
    const now = Time.now();
    if (now.lt(manifoldClaim.nextMemePhase.start)) {
      return "Upcoming";
    }
    if (now.lt(manifoldClaim.nextMemePhase.end)) {
      return "Active";
    }
  }

  return capitalizeEveryWord(manifoldClaim.status);
}

export function formatClaimCost(manifoldClaim: ManifoldClaim): string {
  const costWei = manifoldClaim.costWei ?? 0n;
  if (costWei > 0n) {
    return `${formatWeiToEth(costWei)} ETH`;
  } else {
    return `N/A`;
  }
}
