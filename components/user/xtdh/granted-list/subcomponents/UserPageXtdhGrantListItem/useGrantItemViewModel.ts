"use client";

import {
  formatAmount,
  formatDateTime,
  formatTdhRatePerToken,
  getTargetTokensCountInfo,
} from "@/components/user/xtdh/utils/xtdhGrantFormatters";
import type { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";
import type { ContractOverview, SupportedChain } from "@/types/nft";

import {
  formatFloorPrice,
  formatTotalSupply,
  getContractAddress,
  mapGrantChainToSupportedChain,
} from "./formatters";
import type { GrantDetails, GrantItemVariant } from "./types";



interface GrantItemViewModel {
  readonly contract: ContractOverview | null;
  readonly contractAddress: `0x${string}` | null;
  readonly chain: SupportedChain | null;
  readonly contractLabel: string;
  readonly details: GrantDetails;
  readonly errorDetails: string | null;
  readonly isLoading: boolean;
  readonly status: ApiXTdhGrantStatus;
  readonly variant: GrantItemVariant;
  readonly validFrom: number | null;
  readonly validTo: number | null;
}

function deriveErrorDetails(
  normalizedError: string | null,
  isUnsupportedChain: boolean,
  chainName: string,
  isContractError: boolean,
  hasContractData: boolean
): string | null {
  if (normalizedError) {
    return normalizedError;
  }

  if (isUnsupportedChain) {
    return `Target chain "${chainName}" is not supported yet.`;
  }

  if (isContractError) {
    return hasContractData
      ? "Unable to refresh contract metadata. Showing the most recent cached data."
      : "Unable to load contract metadata.";
  }

  return null;
}

export function useGrantItemViewModel(grant: ApiXTdhGrant): GrantItemViewModel {
  const contractAddress = getContractAddress(grant.target_contract);
  const rawContractLabel = grant.target_contract?.trim();
  const contractLabel =
    contractAddress ?? (rawContractLabel || "this contract");

  let chain: SupportedChain | null = null;
  let isUnsupportedChain = false;

  try {
    chain = mapGrantChainToSupportedChain(grant.target_chain);
  } catch {
    isUnsupportedChain = true;
  }

  const shouldLoadContract = Boolean(contractAddress) && !isUnsupportedChain;
  const {
    data: fetchedContract,
    isError: isContractError,
    isLoading: isContractQueryLoading,
  } = useContractOverviewQuery({
    address: contractAddress,
    chain: chain ?? undefined,
    enabled: shouldLoadContract,
  });
  let contract: ContractOverview | null = null;

  if (!isUnsupportedChain) {
    contract = fetchedContract ?? null;
  }
  const isLoading = shouldLoadContract && isContractQueryLoading;

  const details = buildGrantDetails(grant, contract ?? undefined);
  const hasContractData = Boolean(contract);
  const normalizedErrorDetails = normalizeErrorDetails(grant.error_details);
  const derivedErrorDetails = deriveErrorDetails(
    normalizedErrorDetails,
    isUnsupportedChain,
    grant.target_chain,
    isContractError,
    hasContractData
  );

  return {
    contract: contract ?? null,
    contractAddress: contractAddress ?? null,
    chain,
    contractLabel,
    details,
    errorDetails: derivedErrorDetails,
    isLoading,
    status: grant.status,
    variant: hasContractData ? "contract" : "error",
    validFrom: grant.valid_from ?? null,
    validTo: grant.valid_to ?? null,
  };
}

function buildGrantDetails(
  grant: ApiXTdhGrant,
  contract?: ContractOverview
): GrantDetails {
  const baseDetails = createBaseGrantDetails(grant);

  if (!contract) {
    return baseDetails;
  }

  return {
    ...baseDetails,
    tokenTypeLabel: contract.tokenType ?? "Unknown",
    totalSupplyLabel: formatTotalSupply(contract.totalSupply),
    floorPriceLabel: formatFloorPrice(contract.floorPriceEth),
  };
}

function createBaseGrantDetails(grant: ApiXTdhGrant): GrantDetails {
  const tokensCountInfo = getTargetTokensCountInfo(
    grant.target_tokens_count ?? null
  );
  const tokensCountValue =
    typeof tokensCountInfo.count === "number" ? tokensCountInfo.count : null;
  const tdhRateLabel = formatAmount(grant.rate);
  const perTokenLabel = formatTdhRatePerToken(
    grant.rate,
    tokensCountValue
  );
  const tokensDescription = (() => {
    if (tokensCountInfo.kind === "all") {
      return "all tokens in this collection";
    }
    if (tokensCountInfo.kind === "count") {
      return `${tokensCountInfo.label} tokens granted`;
    }
    return "an unknown number of tokens";
  })();

  return {
    tokenTypeLabel: "Unknown",
    totalSupplyLabel: "Unknown",
    floorPriceLabel: "Unknown",
    tokensCountLabel: tokensCountInfo.label,
    tdhRateLabel,
    tdhRatePerTokenLabel: perTokenLabel,
    tdhRatePerTokenHint: perTokenLabel
      ? `${tdhRateLabel} total TDH ÷ ${tokensDescription}`
      : null,
    totalGrantedLabel: formatAmount(grant.total_granted),
    validFromLabel: formatDateTime(grant.valid_from ?? null, {
      fallbackLabel: "Immediately",
      includeTime: false,
    }),

  };
}

function normalizeErrorDetails(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length ? trimmed : null;
}
