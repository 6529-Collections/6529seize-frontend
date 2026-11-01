import type { Address, WorkKey } from "@/lib/stream/types";

/**
 * Work keys: a canonical 6529 Stream token is its bare token ID ("12"); any
 * other token is `<contract>-<tokenId>` ("0xabc…-3"), so `/stream/works/[id]`
 * can show every variant.
 */

const DIGITS = /^[1-9]\d{0,15}$/;
const CONTRACT_KEY = /^(0x[0-9a-fA-F]{40})-([1-9]\d{0,15})$/;

type ParsedWorkKey =
  | { readonly kind: "stream"; readonly tokenId: number }
  | {
      readonly kind: "contract";
      readonly contract: Address;
      readonly tokenId: number;
    };

export function parseWorkKey(key: string): ParsedWorkKey | null {
  const trimmed = key.trim();
  if (DIGITS.test(trimmed)) {
    const tokenId = Number(trimmed);
    return Number.isSafeInteger(tokenId) ? { kind: "stream", tokenId } : null;
  }
  const match = CONTRACT_KEY.exec(trimmed);
  const contract = match?.[1];
  const tokenId = match?.[2];
  if (
    contract === undefined ||
    tokenId === undefined ||
    !Number.isSafeInteger(Number(tokenId))
  ) {
    return null;
  }
  return {
    kind: "contract",
    contract: contract.toLowerCase() as Address,
    tokenId: Number(tokenId),
  };
}

/** The key for a token; `stream` is the canonical 6529 Stream address. */
export function workKeyFor(
  token: Address,
  tokenId: number,
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
