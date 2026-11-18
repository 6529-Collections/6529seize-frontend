/** Wallet forwarding: the exact size of a request's browser fragment. */

import {
  MAX_ENVELOPE_CHARS,
  WALLET_FORWARDING_VERSION,
  type WalletRequestInput,
} from "./shared";

/** Envelope fields at the longest the shell can make them. */
const LONGEST_ENVELOPE_FIELDS = {
  v: WALLET_FORWARDING_VERSION,
  id: "A".repeat(43),
  scheme: "stagingcore6529",
  origin: "http://localhost:65535",
  issuedAt: 9_999_999_999_999,
  expiresAt: 9_999_999_999_999,
} as const;

/** `#w=` + `&s=` + a 65-byte hex signature. */
const FRAGMENT_OVERHEAD = 3 + 3 + 132;

/** Unpadded base64url length of `byteLength` bytes. */
export const base64UrlLength = (byteLength: number): number =>
  Math.ceil((byteLength * 4) / 3);

/**
 * Whether the browser fragment for this request stays within the page's
 * 32 Ki-character cap, measured exactly (UTF-8 bytes of the JSON envelope,
 * then base64url) with every envelope field at its longest. The app checks
 * this before asking the shell, so a request the browser page would reject
 * is never sent; the shell checks the real fragment.
 */
export function fitsWalletRequestFragment(input: WalletRequestInput): boolean {
  let byteLength: number;
  try {
    byteLength = new TextEncoder().encode(
      JSON.stringify({ ...LONGEST_ENVELOPE_FIELDS, request: input })
    ).length;
  } catch {
    return false;
  }
  return FRAGMENT_OVERHEAD + base64UrlLength(byteLength) <= MAX_ENVELOPE_CHARS;
}
