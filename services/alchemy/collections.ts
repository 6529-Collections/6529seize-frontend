import { isValidEthAddress } from "@/helpers/Helpers";
import type { ContractOverview, Suggestion } from "@/types/nft";

import type {
  AlchemyContractResult,
  AlchemyContractMetadata,
  AlchemyContractMetadataResponse,
  AlchemySearchResponse,
  ContractOverviewParams,
  SearchContractsParams,
  SearchContractsResult,
} from "./types";
import {
  extractContract,
  ensureQuery,
  normaliseAddress,
  resolveNetwork,
  resolveOpenSeaMetadata,
} from "./utils";
import { getAlchemyApiKey } from "@/config/alchemyEnv";

export async function searchNftCollections(
  params: SearchContractsParams
): Promise<SearchContractsResult> {
  const { query, chain = "ethereum", pageKey, hideSpam = true, signal } = params;
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
    signal,
  });
  if (!response.ok) {
    throw new Error("Failed to search NFT collections");
  }
  const payload = (await response.json()) as
    | AlchemySearchResponse
    | undefined;
  const contracts = payload?.contracts ?? [];
  const suggestions = contracts
    .map((contract) => extractContract(contract))
    .filter((suggestion): suggestion is Suggestion => suggestion !== null);
  const hiddenCount = hideSpam
    ? suggestions.filter((suggestion) => suggestion.isSpam).length
    : 0;
  const visibleItems = hideSpam
    ? suggestions.filter((suggestion) => !suggestion.isSpam)
    : suggestions;
  return {
    items: visibleItems,
    hiddenCount,
    nextPageKey: payload?.pageKey,
  };
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
    signal,
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
  if (!payload) {
    return null;
  }
  const baseMeta: AlchemyContractMetadata =
    payload.contractMetadata ?? payload;
  const openSeaMetadata = resolveOpenSeaMetadata(
    payload,
    payload.contractMetadata,
    baseMeta
  );
  const contract: AlchemyContractResult = {
    ...baseMeta,
    contractMetadata: baseMeta,
    address: checksum,
    contractAddress: checksum,
    openSeaMetadata,
    isSpam:
      payload.isSpam ?? baseMeta.isSpam ?? baseMeta.spamInfo?.isSpam,
  };
  const suggestion = extractContract(contract);
  if (!suggestion) {
    return null;
  }
  const openSea = openSeaMetadata;
  return {
    ...suggestion,
    description: openSea?.description ?? null,
    bannerImageUrl: openSea?.bannerImageUrl ?? null,
  };
}
