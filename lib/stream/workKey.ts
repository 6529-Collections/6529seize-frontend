import type { Address, WorkKey } from "@/lib/stream/types";

/**
 * Work keys: a canonical 6529 Stream token is its bare token ID ("12"); any
 * other token is `<contract>-<tokenId>` ("0xabc…-3"), so `/stream/works/[id]`
 * can show every variant.
 */

/** A uint256 token ID in decimal, without leading zeros (78 digits at most). */
const DIGITS = /^(?:0|[1-9]\d{0,77})$/;
const CONTRACT_KEY = /^(0x[0-9a-fA-F]{40})-(0|[1-9]\d{0,77})$/;
const UINT256_MAX = (1n << 256n) - 1n;

/**
 * Token IDs are uint256: a bigint here, a decimal string in keys and URLs.
 * Federated token IDs can exceed 2^53, so they never pass through a number.
 */
type ParsedWorkKey =
  | { readonly kind: "stream"; readonly tokenId: bigint }
  | {
      readonly kind: "contract";
      readonly contract: Address;
      readonly tokenId: bigint;
    };

/** A decimal uint256, or null when it is not one. */
function parseUint256(text: string): bigint | null {
  if (!DIGITS.test(text)) {
    return null;
  }
  const value = BigInt(text);
  return value <= UINT256_MAX ? value : null;
}

export function parseWorkKey(key: string): ParsedWorkKey | null {
  const trimmed = key.trim();
  if (DIGITS.test(trimmed)) {
    const tokenId = parseUint256(trimmed);
    // 6529 Stream token IDs start at 1.
    return tokenId === null || tokenId === 0n
      ? null
      : { kind: "stream", tokenId };
  }
  const match = CONTRACT_KEY.exec(trimmed);
  const contract = match?.[1];
  const tokenId = parseUint256(match?.[2] ?? "");
  if (contract === undefined || tokenId === null) {
    return null;
  }
  return {
    kind: "contract",
    contract: contract.toLowerCase() as Address,
    tokenId,
  };
}

/** The key for a token; `stream` is the canonical 6529 Stream address. */
export function workKeyFor(
  token: Address,
  tokenId: bigint,
  stream: Address
): WorkKey {
  return token.toLowerCase() === stream.toLowerCase()
    ? String(tokenId)
    : `${token.toLowerCase()}-${tokenId}`;
}

/** Routes the section uses; lanes link through these, not string literals. */
export const STREAM_ROUTES = {
  home: "/stream",
  work: (key: WorkKey) => `/stream/works/${encodeURIComponent(key)}`,
  editions: "/stream/editions",
  edition: (key: WorkKey) => `/stream/editions/${encodeURIComponent(key)}`,
  artists: "/stream/artists",
  artist: (artistId: string) =>
    `/stream/artists/${encodeURIComponent(artistId)}`,
  me: "/stream/me",
  museum: "/stream/museum",
  curation: "/stream/curation",
  federated: "/stream/federated",
  federatedContract: (address: Address) =>
    `/stream/federated/${encodeURIComponent(address.toLowerCase())}`,
  launch: "/stream/launch",
  about: "/stream/about",
  aboutPage: (slug: string) => `/stream/about/${slug}`,
} as const;
