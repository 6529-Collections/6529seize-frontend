import { getEthereumMainnetClient } from "@/lib/ethereum/mainnetClient";
import { createPublicClient, http, type PublicClient } from "viem";
import { hoodi, mainnet, sepolia } from "viem/chains";

import type { EtherscanNetwork } from "@/lib/link-preview/etherscan/types";

const RPC_TIMEOUT_MS = 2500;

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(undefined, {
    retryCount: 0,
    timeout: RPC_TIMEOUT_MS,
  }),
});

const hoodiClient = createPublicClient({
  chain: hoodi,
  transport: http(undefined, {
    retryCount: 0,
    timeout: RPC_TIMEOUT_MS,
  }),
});

const sepoliaEnsClient = createPublicClient({
  chain: sepolia,
  transport: http(undefined, {
    retryCount: 0,
    timeout: RPC_TIMEOUT_MS,
  }),
});

const CLIENTS_BY_CHAIN_ID = new Map<number, PublicClient>([
  [sepolia.id, sepoliaClient],
  [hoodi.id, hoodiClient],
]);

const ENS_CLIENTS_BY_CHAIN_ID = new Map<number, PublicClient>([
  [sepolia.id, sepoliaEnsClient],
]);

export function getEtherscanPublicClient(
  network: EtherscanNetwork
): PublicClient | null {
  if (network.status === "legacy") {
    return null;
  }
  if (network.chainId === mainnet.id) {
    return getEthereumMainnetClient();
  }
  return CLIENTS_BY_CHAIN_ID.get(network.chainId) ?? null;
}

export function getEtherscanEnsClient(
  network: EtherscanNetwork
): PublicClient | null {
  if (network.status === "legacy") {
    return null;
  }
  if (network.chainId === mainnet.id) {
    return getEthereumMainnetClient();
  }
  return ENS_CLIENTS_BY_CHAIN_ID.get(network.chainId) ?? null;
}
