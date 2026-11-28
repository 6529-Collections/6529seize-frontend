// Copied from 6529-Collections/6529-provenance-app src/safeInfo.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  type Address,
  type PublicClient,
} from "viem";
import { safeAbi } from "./safe";

export interface SafeInfo {
  address: Address;
  version?: string | undefined;
  owners: Address[];
  threshold: number;
  nonce: bigint;
}

/**
 * Reads a Safe's owners, threshold and nonce. Returns undefined when the address is not a Safe:
 * it holds no code, or the Safe's read functions revert. A transport error (a dropped request,
 * a rate limit) throws, so the caller retries instead of treating a Safe as an ordinary account.
 */
export async function readSafe(client: PublicClient, address: Address): Promise<SafeInfo | undefined> {
  const code = await client.getCode({ address });
  if (!code || code === "0x") return undefined;
  try {
    const [owners, threshold, nonce] = await Promise.all([
      client.readContract({ address, abi: safeAbi, functionName: "getOwners" }),
      client.readContract({ address, abi: safeAbi, functionName: "getThreshold" }),
      client.readContract({ address, abi: safeAbi, functionName: "nonce" }),
    ]);
    let version: string | undefined;
    try {
      version = await client.readContract({ address, abi: safeAbi, functionName: "VERSION" });
    } catch {
      version = undefined;
    }
    return { address, version, owners: [...owners], threshold: Number(threshold), nonce };
  } catch (e) {
    // A revert or an empty return means the contract is not a Safe; anything else is retried.
    if (
      e instanceof ContractFunctionExecutionError &&
      (e.cause instanceof ContractFunctionRevertedError || e.cause instanceof ContractFunctionZeroDataError)
    )
      return undefined;
    throw e;
  }
}
