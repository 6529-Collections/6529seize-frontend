/**
 * Content identifiers for the profile site files a ProfileDoc's `cms.*`
 * keys name: CIDv1, codec raw (0x55), multihash sha2-256, lower-case base32 with
 * the `b` prefix. The digest is the file's SHA-256, so a CMS
 * `sha256:<hex>` hash and its CID name the same bytes.
 */
const CID_PREFIX = [0x01, 0x55, 0x12, 0x20] as const;
const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
const CMS_HASH_PATTERN = /^sha256:([a-f0-9]{64})$/;

export function cmsCidFromHash(hash: string): string {
  const match = CMS_HASH_PATTERN.exec(hash);
  if (!match?.[1]) {
    throw new Error(`Not a CMS sha256 hash: ${hash}`);
  }
  const digest =
    match[1].match(/../g)?.map((pair) => Number.parseInt(pair, 16)) ?? [];
  return `b${toBase32([...CID_PREFIX, ...digest])}`;
}

function toBase32(bytes: readonly number[]): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}
