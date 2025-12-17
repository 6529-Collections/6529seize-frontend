import { isValidEthAddress } from "@/helpers/Helpers";
import type { TokenMetadata } from "@/types/nft";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import type {
  AlchemyTokenMetadataResponse,
  TokenMetadataParams,
} from "./types";
import {
  normaliseAddress,
  processTokenMetadataResponse,
  resolveNetwork,
} from "./utils";

const MAX_BATCH_SIZE = 100;

export async function getTokensMetadata(
  params: TokenMetadataParams
): Promise<TokenMetadata[]> {
  const {
    address,
    tokenIds,
    tokens: tokensParam,
    chain = "ethereum",
    signal,
  } = params;

  let tokensToFetch: { contract: string; tokenId: string }[] = [];

  if (tokensParam && tokensParam.length > 0) {
    tokensToFetch = [...tokensParam];
  } else if (address && tokenIds && tokenIds.length > 0) {
    if (!isValidEthAddress(address)) {
      throw new Error("Invalid contract address");
    }
    const checksum = normaliseAddress(address);
    if (!checksum) {
      return [];
    }
    tokensToFetch = tokenIds.map((tokenId) => ({
      contract: checksum,
      tokenId,
    }));
  }

  if (tokensToFetch.length === 0) {
    return [];
  }

  const network = resolveNetwork(chain);
  const apiKey = getAlchemyApiKey();
  const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getNFTMetadataBatch`;
  const results: TokenMetadata[] = [];

  for (let i = 0; i < tokensToFetch.length; i += MAX_BATCH_SIZE) {
    const slice = tokensToFetch.slice(i, i + MAX_BATCH_SIZE);
    const body = {
      tokens: slice.map((t) => ({
        contractAddress: t.contract,
        tokenId: t.tokenId,
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
    const batchResults = processTokenMetadataResponse(payload);
    results.push(...batchResults);
  }
  return results;
}
