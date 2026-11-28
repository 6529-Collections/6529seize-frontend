// Copied from 6529-Collections/6529-provenance-app src/client.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
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
