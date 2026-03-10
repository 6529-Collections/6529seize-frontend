import type { BaseNFT, NFTLite } from "@/entities/INFT";

const normalizeNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function getResolvedImageSrc(
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
          readonly image?: unknown;
        })
      : undefined;

  const candidates = [metadata?.image, nft.image];

  for (const candidate of candidates) {
    const resolved = normalizeNonEmptyString(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return undefined;
}
