import { isValidEthAddress } from "@/helpers/Helpers";
import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import type { SupportedChain } from "@/types/nft";

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
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatContractLabel(contract?: string): string {
  if (!contract) {
    return "this contract";
  }

  if (isValidEthAddress(contract)) {
    return shortenAddress(contract as `0x${string}`);
  }

  return contract;
}

export function formatTotalSupply(value?: string | null): string {
  if (!value) {
    return "Unknown";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return value;
  }

  return new Intl.NumberFormat().format(parsed);
}

export function formatFloorPrice(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Unknown";
  }

  return `Ξ${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)}`;
}

export function mapGrantChainToSupportedChain(
  chain: ApiTdhGrantsPage["data"][number]["target_chain"]
): SupportedChain {
  switch (chain) {
    case "ETHEREUM_MAINNET":
    default:
      return "ethereum";
  }
}
