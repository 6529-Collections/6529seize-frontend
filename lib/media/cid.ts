/**
 * Converts an IPFS CID to the lower-case base32 CIDv1 form that fits one DNS
 * label, as subdomain gateways require (`<cid>.ipfs.<gateway>`).
 *
 * - CIDv0 (`Qm…`, base58btc) must be a 34-byte sha2-256 multihash; it becomes
 *   a dag-pb CIDv1.
 * - CIDv1 must be multibase base32 in one case (`b…` lower or `B…` upper),
 *   decode to a well-formed CIDv1 and use canonical base32.
 *
 * Returns null for anything else, including CIDs too long for one label.
 */

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

const CID_V0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CID_V1_LOWER_PATTERN = /^b[a-z2-7]+$/;
const CID_V1_UPPER_PATTERN = /^B[A-Z2-7]+$/;
// One DNS label, as the subdomain gateway accepts it.
const SUBDOMAIN_LABEL_PATTERN = /^b[a-z2-7]{50,61}$/;

const SHA2_256_CODE = 0x12;
const SHA2_256_LENGTH = 32;
const CID_VERSION_1 = 0x01;
const DAG_PB_CODEC = 0x70;
// Multicodec and multihash codes in use fit in four varint bytes.
const MAX_VARINT_BYTES = 4;

function decodeBase58(value: string): number[] | null {
  const bytes: number[] = [];
  for (const character of value) {
    let carry = BASE58_ALPHABET.indexOf(character);
    if (carry < 0) {
      return null;
    }
    for (let index = 0; index < bytes.length; index += 1) {
      carry += (bytes[index] ?? 0) * 58;
      bytes[index] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const character of value) {
    if (character !== "1") {
      break;
    }
    bytes.push(0);
  }
  return bytes.reverse();
}

function encodeBase32(bytes: readonly number[]): string {
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
  }
  return output;
}

function decodeBase32(value: string): number[] | null {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const character of value) {
    const digit = BASE32_ALPHABET.indexOf(character);
    if (digit < 0) {
      return null;
    }
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
    buffer &= (1 << bits) - 1;
  }
  // Canonical base32 leaves fewer than five unused bits, all zero.
  return bits < 5 && buffer === 0 ? bytes : null;
}

function readVarint(
  bytes: readonly number[],
  offset: number
): { readonly value: number; readonly next: number } | null {
  let value = 0;
  for (let index = 0; index < MAX_VARINT_BYTES; index += 1) {
    const byte = bytes[offset + index];
    if (byte === undefined) {
      return null;
    }
    value += (byte & 0x7f) * 2 ** (7 * index);
    if ((byte & 0x80) === 0) {
      // A trailing zero byte would be a non-minimal encoding.
      return index > 0 && byte === 0
        ? null
        : { value, next: offset + index + 1 };
    }
  }
  return null;
}

function isWellFormedCidV1(bytes: readonly number[]): boolean {
  const version = readVarint(bytes, 0);
  if (version?.value !== CID_VERSION_1) {
    return false;
  }
  const codec = readVarint(bytes, version.next);
  if (!codec) {
    return false;
  }
  const hashCode = readVarint(bytes, codec.next);
  if (!hashCode) {
    return false;
  }
  const digestLength = readVarint(bytes, hashCode.next);
  return (
    digestLength !== null &&
    digestLength.value > 0 &&
    bytes.length - digestLength.next === digestLength.value
  );
}

function cidV0ToV1Bytes(cid: string): number[] | null {
  const multihash = decodeBase58(cid);
  if (
    multihash?.length !== SHA2_256_LENGTH + 2 ||
    multihash[0] !== SHA2_256_CODE ||
    multihash[1] !== SHA2_256_LENGTH
  ) {
    return null;
  }
  return [CID_VERSION_1, DAG_PB_CODEC, ...multihash];
}

function cidV1ToBytes(cid: string): number[] | null {
  if (!CID_V1_LOWER_PATTERN.test(cid) && !CID_V1_UPPER_PATTERN.test(cid)) {
    return null;
  }
  const bytes = decodeBase32(cid.slice(1).toLowerCase());
  return bytes && isWellFormedCidV1(bytes) ? bytes : null;
}

export function toCidV1Base32Label(cid: string): string | null {
  const bytes = CID_V0_PATTERN.test(cid)
    ? cidV0ToV1Bytes(cid)
    : cidV1ToBytes(cid);
  if (!bytes) {
    return null;
  }
  const label = `b${encodeBase32(bytes)}`;
  return SUBDOMAIN_LABEL_PATTERN.test(label) ? label : null;
}
