import { isAddress } from "viem";

/**
 * Validates that a string is a strict Ethereum address.
 * Must start with 0x and be exactly 42 characters long.
 * ENS names and other formats are rejected.
 */
export function validateStrictAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  const trimmed = address.trim();
  if (trimmed.length !== 42 || !trimmed.startsWith("0x")) {
    return false;
  }

  return isAddress(trimmed.toLowerCase());
}
