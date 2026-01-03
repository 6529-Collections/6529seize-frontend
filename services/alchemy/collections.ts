import { isValidEthAddress } from "@/helpers/Helpers";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import type { ContractOverview } from "@/types/nft";
import type {
  AlchemyContractMetadataResponse,
  AlchemySearchResponse,
  ContractOverviewParams,
  SearchContractsParams,
  SearchContractsResult,
} from "./types";
import {
  ensureQuery,
  normaliseAddress,
  processContractMetadataResponse,
  processSearchResponse,
  resolveNetwork,
} from "./utils";

export async function searchNftCollections(
  params: SearchContractsParams
): Promise<SearchContractsResult> {
  const {
    query,
    chain = "ethereum",
    pageKey,
    hideSpam = true,
    signal,
  } = params;
  const trimmed = ensureQuery(query);
  const network = resolveNetwork(chain);
  const apiKey = getAlchemyApiKey();
  const url = new URL(
    `https://${network}.g.alchemy.com/nft/v3/${apiKey}/searchContractMetadata`
  );
  url.searchParams.set("query", trimmed);
  if (pageKey) {
    url.searchParams.set("pageKey", pageKey);
  }
  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    ...(signal !== undefined ? { signal: signal } : {}),
  });
  if (!response.ok) {
    throw new Error("Failed to search NFT collections");
  }
  const payload = (await response.json()) as AlchemySearchResponse | undefined;
  return processSearchResponse(payload, hideSpam);
}

export async function getContractOverview(
  params: ContractOverviewParams
): Promise<ContractOverview | null> {
  const { address, chain = "ethereum", signal } = params;
  if (!isValidEthAddress(address)) {
    throw new Error("Invalid contract address");
  }
  const checksum = normaliseAddress(address);
  if (!checksum) {
    return null;
  }
  const network = resolveNetwork(chain);
  const apiKey = getAlchemyApiKey();
  const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata?contractAddress=${checksum}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    ...(signal !== undefined ? { signal: signal } : {}),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to fetch contract metadata");
  }
  const payload = (await response.json()) as
    | AlchemyContractMetadataResponse
    | undefined;
  return processContractMetadataResponse(payload, checksum);
}
