// Copied from 6529-Collections/6529-provenance-app src/client.ts at commit 117e850026f6e1d754e76a687e526f51cceca4a0.
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
