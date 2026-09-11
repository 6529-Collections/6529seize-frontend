import { createPublicClient, fallback, http, type PublicClient } from "viem";
import { hoodi, mainnet, sepolia } from "viem/chains";

import type { EtherscanNetwork } from "@/lib/link-preview/etherscan/types";

const RPC_TIMEOUT_MS = 2500;

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http("https://rpc1.6529.io", {
      retryCount: 0,
      timeout: RPC_TIMEOUT_MS,
    }),
    http(undefined, { retryCount: 0, timeout: RPC_TIMEOUT_MS }),
  ]),
});

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

// ENS lookups use isolated public transports so untrusted names never consume
// the first-party mainnet RPC used for bounded entity reads.
const mainnetEnsClient = createPublicClient({
  chain: mainnet,
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
  [mainnet.id, mainnetClient],
  [sepolia.id, sepoliaClient],
  [hoodi.id, hoodiClient],
]);

const ENS_CLIENTS_BY_CHAIN_ID = new Map<number, PublicClient>([
  [mainnet.id, mainnetEnsClient],
  [sepolia.id, sepoliaEnsClient],
]);

export function getEtherscanPublicClient(
  network: EtherscanNetwork
): PublicClient | null {
  if (network.status === "legacy") {
    return null;
  }
  return CLIENTS_BY_CHAIN_ID.get(network.chainId) ?? null;
}

export function getEtherscanEnsClient(
  network: EtherscanNetwork
): PublicClient | null {
  if (network.status === "legacy") {
    return null;
  }
  return ENS_CLIENTS_BY_CHAIN_ID.get(network.chainId) ?? null;
}
