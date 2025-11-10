"use client";

import {
  formatAmount,
  formatDateTime,
  formatTdhRatePerToken,
  getTargetTokensCountInfo,
} from "@/components/user/xtdh/utils/xtdhGrantFormatters";
import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
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
  readonly chain: SupportedChain;
  readonly contractLabel?: string;
  readonly details: GrantDetails;
  readonly errorDetails: string | null;
  readonly isLoading: boolean;
  readonly status: string;
  readonly variant: GrantItemVariant;
}

export function useGrantItemViewModel(
  grant: ApiTdhGrantsPage["data"][number]
): GrantItemViewModel {
  const contractAddress = getContractAddress(grant.target_contract);
  const chain = mapGrantChainToSupportedChain(grant.target_chain);
  const { data: contract, isError, isLoading } = useContractOverviewQuery({
    address: contractAddress,
    chain,
    enabled: Boolean(contractAddress),
  });

  const details = buildGrantDetails(grant, contract ?? undefined);
  const hasContractData = Boolean(contract) && !isError;

  return {
    contract: contract ?? null,
    contractAddress: contractAddress ?? null,
    chain,
    contractLabel: contractAddress ?? grant.target_contract,
    details,
    errorDetails: normalizeErrorDetails(grant.error_details),
    isLoading,
    status: grant.status,
    variant: hasContractData ? "contract" : "error",
  };
}

function buildGrantDetails(
  grant: ApiTdhGrantsPage["data"][number],
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

function createBaseGrantDetails(
  grant: ApiTdhGrantsPage["data"][number]
): GrantDetails {
  const tokensCountInfo = getTargetTokensCountInfo(grant.target_tokens);
  const tokensCountValue =
    typeof tokensCountInfo.count === "number" ? tokensCountInfo.count : null;
  const tdhRateLabel = formatAmount(grant.tdh_rate);
  const perTokenLabel = formatTdhRatePerToken(
    grant.tdh_rate,
    tokensCountValue
  );
  const tokensDescription =
    tokensCountInfo.kind === "all"
      ? "all tokens in this collection"
      : `${tokensCountInfo.label} tokens granted`;

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
    validFromLabel: formatDateTime(grant.valid_from ?? null, {
      fallbackLabel: "Immediately",
    }),
    validUntilLabel: formatDateTime(grant.valid_to ?? null),
  };
}

function normalizeErrorDetails(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length ? trimmed : null;
}
