/** Wallet forwarding: the short code shown in the app and in the browser. */

import { sha256 } from "viem";

/**
 * Short code shown both in the app and on the browser page, so the user can
 * tell that the page belongs to the request they started.
 * Six hex characters of SHA-256 over the id, as `ABC-123`.
 */
export function walletRequestCode(id: string): string {
  const digest = sha256(new TextEncoder().encode(id)).slice(2, 8).toUpperCase();
  return `${digest.slice(0, 3)}-${digest.slice(3)}`;
}
