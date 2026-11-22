/**
 * Safe transactions for 6529 Desktop: what the browser page reads from the
 * chain before it offers Sign. Any failed read blocks (governance is not
 * urgent): the user checks again.
 */

import type { Address } from "viem";
import type { SafeTxDescription } from "./describe";

const SAFE_READ_ABI = [
  {
    type: "function",
    name: "getOwners",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "getThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "nonce",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const REGISTRY_READ_ABI = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "pendingOwner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

/** The read calls the page needs (a viem public client satisfies this). */
export interface SafeReader {
  readContract(parameters: {
    readonly address: Address;
    readonly abi: readonly unknown[];
    readonly functionName: string;
    readonly args?: readonly unknown[];
  }): Promise<unknown>;
}

export type SafeTxPreflight =
  | {
      readonly kind: "ok";
      readonly owners: number;
      readonly threshold: bigint;
      readonly currentNonce: bigint;
    }
  /** A registry is not owned by this Safe (or, for acceptOwnership, not pending). */
  | { readonly kind: "notOwner"; readonly registry: string }
  | { readonly kind: "notPendingOwner"; readonly registry: string }
  /** The signing wallet is not one of the Safe's owners. */
  | { readonly kind: "notSigner" }
  /** The Safe already used this nonce. */
  | { readonly kind: "usedNonce"; readonly currentNonce: bigint };

const same = (a: unknown, b: string): boolean =>
  typeof a === "string" && a.toLowerCase() === b.toLowerCase();

/**
 * Reads the Safe (owners, threshold, nonce) and each registry's owner (or
 * pending owner for `acceptOwnership`), and says whether the page may
 * offer Sign. Throws when a read fails.
 */
export async function readSafeTxPreflight(
  client: SafeReader,
  description: SafeTxDescription,
  signer: string
): Promise<SafeTxPreflight> {
  const safe = description.safe as Address;
  const read = (address: Address, abi: readonly unknown[], name: string) =>
    client.readContract({ address, abi, functionName: name });
  const [owners, threshold, currentNonce] = await Promise.all([
    read(safe, SAFE_READ_ABI, "getOwners"),
    read(safe, SAFE_READ_ABI, "getThreshold"),
    read(safe, SAFE_READ_ABI, "nonce"),
  ]);
  for (const call of description.calls) {
    const registry = call.registry as Address;
    if (call.ruleId === "governance.acceptOwnership") {
      const pending = await read(registry, REGISTRY_READ_ABI, "pendingOwner");
      if (!same(pending, safe)) return { kind: "notPendingOwner", registry };
    } else {
      const owner = await read(registry, REGISTRY_READ_ABI, "owner");
      if (!same(owner, safe)) return { kind: "notOwner", registry };
    }
  }
  const ownerList = Array.isArray(owners) ? (owners as unknown[]) : [];
  if (!ownerList.some((owner) => same(owner, signer))) {
    return { kind: "notSigner" };
  }
  if (typeof currentNonce !== "bigint" || typeof threshold !== "bigint") {
    throw new TypeError("Unexpected Safe read");
  }
  if (description.nonce < currentNonce) {
    return { kind: "usedNonce", currentNonce };
  }
  return { kind: "ok", owners: ownerList.length, threshold, currentNonce };
}
