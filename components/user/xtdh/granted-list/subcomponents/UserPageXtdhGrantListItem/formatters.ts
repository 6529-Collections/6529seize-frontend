import { ApiXTdhGrantTargetChain } from "@/generated/models/ApiXTdhGrantTargetChain";
import type { SupportedChain } from "@/types/nft";
import { isValidEthAddress } from "@/helpers/Helpers";
import { shortenAddress as shortenGenericAddress } from "@/helpers/address.helpers";
import { getTargetTokensCountInfo } from "@/components/user/xtdh/utils/xtdhGrantFormatters";

import type { TokenPanelState } from "./types";

const GRANT_CHAIN_TO_SUPPORTED_CHAIN: Record<
  ApiXTdhGrantTargetChain,
  SupportedChain
> = {
  [ApiXTdhGrantTargetChain.EthereumMainnet]: "ethereum",
};

export function getContractAddress(
  contract: string
): `0x${string}` | undefined {
  if (!contract) {
    return undefined;
  }

  const trimmed = contract.trim();

  if (!isValidEthAddress(trimmed)) {
    return undefined;
  }

  return trimmed as `0x${string}`;
}

export function shortenAddress(address: `0x${string}`): string {
  return shortenGenericAddress(address);
}

export function formatContractLabel(contract?: string): string {
  if (!contract) {
    return "this contract";
  }

  const address = getContractAddress(contract);
  if (address) {
    return shortenAddress(address);
  }

  return contract;
}

export function formatTotalSupply(value?: string | null): string {
  if (!value) {
    return "Unknown";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "Unknown";
  }

  return new Intl.NumberFormat().format(parsed);
}

export function formatFloorPrice(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Unknown";
  }

  return `Ξ${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)}`;
}

export function mapGrantChainToSupportedChain(
  chain: ApiXTdhGrantTargetChain
): SupportedChain {
  const supportedChain = GRANT_CHAIN_TO_SUPPORTED_CHAIN[chain];

  if (!supportedChain) {
    throw new Error(`Unsupported TDH grant target chain: ${chain}`);
  }

  return supportedChain;
}

export function mapTokenCountToState(
  count: number | null | undefined
): TokenPanelState {
  const info = getTargetTokensCountInfo(count);

  if (info.kind === "all") {
    return { type: "all" };
  }

  if (info.kind === "count") {
    return { type: "count", label: info.label, count: info.count };
  }

  return { type: "unknown", label: info.label };
}
