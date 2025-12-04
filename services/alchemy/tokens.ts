import { isValidEthAddress } from "@/helpers/Helpers";
import type { TokenMetadata } from "@/types/nft";

import type {
  AlchemyTokenMetadataEntry,
  AlchemyTokenMetadataResponse,
  TokenMetadataParams,
} from "./types";
import { normaliseAddress, pickThumbnail, resolveNetwork } from "./utils";
import { getAlchemyApiKey } from "@/config/alchemyEnv";

const MAX_BATCH_SIZE = 100;

function parseTokenIdToBigint(tokenId: string): bigint {
  if (!tokenId) {
    throw new Error("Token ID missing");
  }
  const trimmed = tokenId.trim();
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    return BigInt(trimmed);
  }
  return BigInt(trimmed);
}

function normaliseTokenMetadata(
  token: AlchemyTokenMetadataEntry
): TokenMetadata | null {
  const tokenIdRaw = token.tokenId ?? "";
  try {
    const tokenId = parseTokenIdToBigint(tokenIdRaw);
    const imageUrl = pickThumbnail({
      image: token.image ?? undefined,
      media: token.media ?? undefined,
    });
    return {
      tokenId,
      tokenIdRaw,
      name:
        token.title ??
        token.name ??
        token.metadata?.name ??
        token.raw?.metadata?.name ??
        null,
      imageUrl,
      isSpam: token.isSpam ?? token.spamInfo?.isSpam ?? false,
    };
  } catch (error) {
    console.warn("Failed to parse token metadata", tokenIdRaw, error);
    return null;
  }
}

export async function getTokensMetadata(
  params: TokenMetadataParams
): Promise<TokenMetadata[]> {
  const { address, tokenIds, chain = "ethereum", signal } = params;
  if (!tokenIds.length) {
    return [];
  }
  if (!isValidEthAddress(address)) {
    throw new Error("Invalid contract address");
  }
  const checksum = normaliseAddress(address);
  if (!checksum) {
    return [];
  }
  const network = resolveNetwork(chain);
  const apiKey = getAlchemyApiKey();
  const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getNFTMetadataBatch`;
  const results: TokenMetadata[] = [];
  for (let i = 0; i < tokenIds.length; i += MAX_BATCH_SIZE) {
    const slice = tokenIds.slice(i, i + MAX_BATCH_SIZE);
    const body = {
      tokens: slice.map((tokenId) => ({
        contractAddress: checksum,
        tokenId,
      })),
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
 
    if (!response.ok) {
      throw new Error("Failed to fetch token metadata");
    }
    const payload = (await response.json()) as AlchemyTokenMetadataResponse;
    const tokens = payload.tokens ?? payload.nfts ?? [];
    for (const token of tokens) {
      const normalised = normaliseTokenMetadata(token);
      if (normalised) {
        results.push(normalised);
      }
    }
  }
  return results;
}
