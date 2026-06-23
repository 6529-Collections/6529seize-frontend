import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiWaveCreditNft } from "@/generated/models/ApiWaveCreditNft";

const MEMES_CONTRACT_LOWER = MEMES_CONTRACT.toLowerCase();

export function normalizeCardSetTdhTokenIds(
  creditNfts: readonly ApiWaveCreditNft[] | null | undefined
): number[] {
  const tokenIds = new Set<number>();

  for (const nft of creditNfts ?? []) {
    if (nft.contract.toLowerCase() !== MEMES_CONTRACT_LOWER) {
      continue;
    }

    if (!Number.isInteger(nft.token_id)) {
      continue;
    }

    tokenIds.add(nft.token_id);
  }

  return Array.from(tokenIds).sort((a, b) => a - b);
}

export function getMemeCardCountLabel(count: number): string {
  return `${count} Meme ${count === 1 ? "card" : "cards"}`;
}
