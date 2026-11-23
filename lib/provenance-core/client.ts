// Copied from 6529-Collections/6529-provenance-app src/client.ts at commit 171ab352f90bb56f3e2248d4fd5b8e69b2a39092.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import { createPublicClient, http, type PublicClient } from "viem";
import { chainById } from "./config/chains";

/** A read client with retries: the public Sepolia endpoint drops some requests under load. */
export function makeClient(chainId: number, rpcUrl: string): PublicClient {
  const chain = chainById(chainId);
  return createPublicClient({
    chain,
    transport: http(rpcUrl, { retryCount: 4, retryDelay: 600, timeout: 60_000 }),
    batch: { multicall: false },
  }) as PublicClient;
}
