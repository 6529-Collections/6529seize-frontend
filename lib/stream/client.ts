import { createPublicClient, fallback, http, type PublicClient } from "viem";
import { sepolia } from "viem/chains";

import { CW_PROJECT_ID } from "@/constants/constants";

/**
 * Public Sepolia RPCs for reading 6529 Stream state. The first two serve
 * `eth_getLogs` across the whole instance range (publicnode only sometimes);
 * the WalletConnect RPC the site already uses is the last fallback for plain reads.
 * Requests are sent one per HTTP call (viem's default): the Tenderly gateway
 * can hang on batched JSON-RPC arrays. Contract reads issued within 50 ms of
 * each other (every card on a page) go out as one Multicall3 eth_call.
 * These are shared public endpoints: a rate-limited (429) or failed call moves
 * to the next RPC at once, and the whole set is retried with growing pauses
 * (1 s, 2 s, 4 s) instead of hammering the same endpoint.
 */
const RPC_TIMEOUT_MS = 15_000;
const transportOf = (urls: readonly string[]) =>
  fallback(
    urls.map((url) => http(url, { retryCount: 0, timeout: RPC_TIMEOUT_MS })),
    { retryCount: 3, retryDelay: 1_000 }
  );
const SEPOLIA_LOG_RPCS = [
  "https://sepolia.gateway.tenderly.co",
  "https://ethereum-sepolia-rpc.publicnode.com",
] as const;

const SEPOLIA_READ_RPCS = [
  ...SEPOLIA_LOG_RPCS,
  `https://rpc.walletconnect.org/v1/?chainId=eip155:${sepolia.id}&projectId=${CW_PROJECT_ID}`,
] as const;

let client: PublicClient | null = null;

export function getStreamClient(): PublicClient {
  client ??= createPublicClient({
    chain: sepolia,
    batch: { multicall: { wait: 50 } },
    transport: transportOf(SEPOLIA_READ_RPCS),
  }) as PublicClient;
  return client;
}

let logClient: PublicClient | null = null;

/** Log scans need an RPC that keeps the instance's history; the fallback does not. */
export function getStreamLogClient(): PublicClient {
  logClient ??= createPublicClient({
    chain: sepolia,
    transport: transportOf(SEPOLIA_LOG_RPCS),
  }) as PublicClient;
  return logClient;
}

export const STREAM_CHAIN = sepolia;
