import type { BaseNFT, NFTLite } from "@/entities/INFT";

const normalizeNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export function getResolvedAnimationSrc(
  nft: BaseNFT | NFTLite | undefined
): string | undefined {
  if (!nft) {
    return undefined;
  }

  const metadata =
    "metadata" in nft &&
    nft.metadata !== null &&
    typeof nft.metadata === "object"
      ? (nft.metadata as {
          readonly animation?: unknown;
          readonly animation_url?: unknown;
        })
      : undefined;

  const candidates = [
    nft.animation,
    metadata?.animation,
    metadata?.animation_url,
  ];

  for (const candidate of candidates) {
    const resolved = normalizeNonEmptyString(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return undefined;
}
