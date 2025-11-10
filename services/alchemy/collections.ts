import { publicEnv } from "@/config/env";
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
import { fetchUrl } from "../6529api";

export async function searchNftCollections(
  params: SearchContractsParams
): Promise<SearchContractsResult> {
  const { query, chain = "ethereum", pageKey, hideSpam = true, signal } = params;
  const trimmed = ensureQuery(query);
  const network = resolveNetwork(chain);
  const url = new URL(
    `https://${network}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/searchContractMetadata`
  );
  url.searchParams.set("query", trimmed);
  if (pageKey) {
    url.searchParams.set("pageKey", pageKey);
  }
  const response = await fetchUrl<AlchemySearchResponse | undefined>(
    url.toString(),
    { signal }
  );
  const contracts = response?.contracts ?? [];
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
    nextPageKey: response?.pageKey,
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
  const url = `https://${network}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/getContractMetadata?contractAddress=${checksum}`;
  const response = await fetchUrl<AlchemyContractMetadataResponse | undefined>(
    url,
    { signal }
  );
  if (!response) {
    return null;
  }
  
  const baseMeta: AlchemyContractMetadata =
    response.contractMetadata ?? response;
  const openSeaMetadata = resolveOpenSeaMetadata(
    response,
    response.contractMetadata,
    baseMeta
  );
  const contract: AlchemyContractResult = {
    ...baseMeta,
    contractMetadata: baseMeta,
    address: checksum,
    contractAddress: checksum,
    openSeaMetadata,
    isSpam:
      response.isSpam ??
      baseMeta.isSpam ??
      baseMeta.spamInfo?.isSpam,
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
