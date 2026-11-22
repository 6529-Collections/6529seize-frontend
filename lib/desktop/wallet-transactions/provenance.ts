/**
 * Wallet transactions for 6529 Desktop: what the browser page reads and
 * shows for a 6529 Provenance publisher call.
 */

import type { Address } from "viem";
import type { DecodedTuple, DecodedValue } from "./decode";
import type { TransactionDescription } from "./describe";

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
    name: "isPublisher",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

/** The read calls the page needs (a viem public client satisfies this). */
export interface RegistryReader {
  readContract(parameters: {
    readonly address: Address;
    readonly abi: readonly unknown[];
    readonly functionName: string;
    readonly args?: readonly unknown[];
  }): Promise<unknown>;
}

/** Whether this transaction is a provenance publisher call. */
export const isPublisherCall = (description: TransactionDescription) =>
  description.contract === "provenance";

/**
 * Whether `sender` may publish to `registry` now: an authorized publisher
 * key, or the registry's owner. Either read confirming it is enough; it is
 * refused only when both reads answered and neither confirms it. Throws
 * when a failed read leaves it open.
 */
export async function readPublisherAuthorization(
  client: RegistryReader,
  registry: Address,
  sender: Address
): Promise<boolean> {
  const [owner, publisher] = await Promise.allSettled([
    client.readContract({
      address: registry,
      abi: REGISTRY_READ_ABI,
      functionName: "owner",
    }),
    client.readContract({
      address: registry,
      abi: REGISTRY_READ_ABI,
      functionName: "isPublisher",
      args: [sender],
    }),
  ]);
  const isOwner =
    owner.status === "fulfilled" &&
    typeof owner.value === "string" &&
    owner.value.toLowerCase() === sender.toLowerCase();
  const isPublisher =
    publisher.status === "fulfilled" && publisher.value === true;
  if (isOwner || isPublisher) return true;
  if (owner.status === "rejected") throw owner.reason;
  if (publisher.status === "rejected") throw publisher.reason;
  return false;
}

const BASE32 = "abcdefghijklmnopqrstuvwxyz234567";
const BASE64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function bytesOf(hex: string): number[] {
  const out: number[] = [];
  for (let at = 2; at + 1 < hex.length; at += 2) {
    out.push(Number.parseInt(hex.slice(at, at + 2), 16));
  }
  return out;
}

/** RFC 4648 encoding without padding, `bits` per character. */
function encodeBits(bytes: readonly number[], alphabet: string, bits: number) {
  let out = "";
  let buffer = 0;
  let held = 0;
  const mask = (1 << bits) - 1;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    held += 8;
    while (held >= bits) {
      held -= bits;
      out += alphabet[(buffer >> held) & mask];
    }
    buffer &= (1 << held) - 1;
  }
  if (held > 0) out += alphabet[(buffer << (bits - held)) & mask];
  return out;
}

/** An unsigned varint at `at`: [value, next offset], or null. */
function readVarint(
  bytes: readonly number[],
  at: number
): readonly [number, number] | null {
  let value = 0;
  for (let shift = 0, i = at; i < bytes.length && shift < 28; shift += 7, i++) {
    const byte = bytes[i]!;
    value += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) return [value, i + 1];
  }
  return null;
}

/**
 * Whether the bytes are a whole binary CIDv1: version 1, a codec, then a
 * multihash whose digest length matches the bytes left.
 */
function isCidV1(bytes: readonly number[]): boolean {
  const version = readVarint(bytes, 0);
  if (version?.[0] !== 1) return false;
  const codec = readVarint(bytes, version[1]);
  const hash = codec && readVarint(bytes, codec[1]);
  const length = hash && readVarint(bytes, hash[1]);
  return length !== null && length[1] + length[0] === bytes.length;
}

/**
 * A binary CIDv1 as its usual text (multibase base32, `b...`); any other
 * bytes as hex; null when empty.
 */
export function formatCid(hex: string): string | null {
  const bytes = bytesOf(hex);
  if (bytes.length === 0) return null;
  return isCidV1(bytes) ? `b${encodeBits(bytes, BASE32, 5)}` : hex;
}

/** An Arweave transaction id (base64url of 32 bytes); null when zero. */
export function formatArweaveId(hex: string): string | null {
  const bytes = bytesOf(hex);
  if (bytes.every((byte) => byte === 0)) return null;
  return encodeBits(bytes, BASE64URL, 6);
}

/** The hash algorithms the registry knows. */
export const hashAlgorithmName = (algorithm: DecodedValue | undefined) => {
  if (algorithm === 1n) return "Keccak-256";
  if (algorithm === 2n) return "SHA-256";
  return typeof algorithm === "bigint" ? algorithm.toString() : "";
};

/** One field of a decoded tuple, as text or bigint. */
export const tupleField = (
  tuple: DecodedValue | undefined,
  name: string
): DecodedValue | undefined =>
  typeof tuple === "object" && !Array.isArray(tuple)
    ? (tuple as DecodedTuple)[name]
    : undefined;

/** The decoded argument `name` of a described transaction. */
export const argumentOf = (
  description: TransactionDescription,
  name: string
): DecodedValue | undefined =>
  description.args.find((arg) => arg.name === name)?.value;
