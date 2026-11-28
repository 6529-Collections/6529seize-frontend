import type { Address } from "viem";

import { accountsAbi } from "./abis";
import { getStreamClient } from "./client";
import { getStreamInstance } from "./instances";

/**
 * An account's artist ID in Accounts. A new account gets its address as a
 * number, but an account whose root was replaced keeps its old ID, so the ID
 * is read, never assumed.
 */
export async function artistIdFor(account: Address): Promise<bigint> {
  const stored = await getStreamClient().readContract({
    address: getStreamInstance().addresses.accounts,
    abi: accountsAbi,
    functionName: "artistIdOf",
    args: [account],
  });
  return stored === 0n ? BigInt(account) : stored;
}
