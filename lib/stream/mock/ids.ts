import { getAddress, keccak256, stringToHex } from "viem";

import type { Address, Hex32 } from "@/lib/stream/types";

/**
 * Deterministic fake identifiers for the mock. Every address and hash is the
 * keccak256 of a readable label, so the same scenario always produces the same
 * values and none of them belongs to a real account.
 */

export function mockHash(label: string): Hex32 {
  return keccak256(stringToHex(`6529-stream-mock:${label}`));
}

export function mockAddress(label: string): Address {
  return getAddress(`0x${mockHash(label).slice(-40)}`);
}

/** Lowercase hex of an artist ID, as the renderer's `Artist ID` trait writes it. */
export function artistIdOf(authority: Address): string {
  return authority.toLowerCase().replace(/^0x0+/, "0x");
}

/** A transaction hash for the n-th mock transaction. */
export function mockTxHash(sequence: number): Hex32 {
  return mockHash(`tx:${sequence}`);
}
