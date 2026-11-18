import { toCidV1Base32Label } from "@/lib/media/cid";

const CID_V0 = "QmYMkYKx3Qum7iVHe8jw1qnk8Ep2BdeMUP6Bn4yB4RnSyW";
const CID_V1 = "bafybeieu3ufszpka5nyzhlcrf5cceiy6n3ug6fdx7chbntxvmf2p32ryhe";
const RAW_CID_V1 =
  "bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy";

describe("toCidV1Base32Label", () => {
  it("converts a CIDv0 to its dag-pb base32 CIDv1", () => {
    expect(toCidV1Base32Label(CID_V0)).toBe(CID_V1);
  });

  it("keeps a lower-case base32 CIDv1", () => {
    expect(toCidV1Base32Label(CID_V1)).toBe(CID_V1);
    expect(toCidV1Base32Label(RAW_CID_V1)).toBe(RAW_CID_V1);
  });

  it("lower-cases an upper-case base32 CIDv1", () => {
    expect(toCidV1Base32Label(CID_V1.toUpperCase())).toBe(CID_V1);
  });

  it.each([
    ["mixed case", `B${CID_V1.slice(1)}`],
    ["mixed case body", `${CID_V1.slice(0, 10)}${CID_V1.slice(10).toUpperCase()}`],
    ["non-canonical trailing bits", `${CID_V1.slice(0, -1)}f`],
    ["truncated", CID_V1.slice(0, -2)],
    ["extra bytes", `${CID_V1}aa`],
    ["base58 character outside the alphabet", `${CID_V0.slice(0, -1)}0`],
    ["CIDv0 of the wrong length", `${CID_V0}1`],
    ["base36 CIDv1", "k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyxzyqj2xjonzllnv0v8"],
    ["base58 CIDv1", "zdj7WWeQ43G6JJvLWQWZpyHuAMq6uYWRjkBXFad11vE2LHhQ7"],
    ["empty", ""],
    ["IPNS name", "example.eth"],
  ])("rejects %s", (_label, value) => {
    expect(toCidV1Base32Label(value)).toBeNull();
  });

  it("rejects a CIDv0 that is not a 34-byte sha2-256 multihash", () => {
    // 0x12 0x21 + 32 bytes: the declared digest length is not 32.
    expect(
      toCidV1Base32Label("Qms86d5RNrh3192CyNrTftc5VxW8ULZj3178wPX5VXUcUA")
    ).toBeNull();
    // 0x13 0x20 + 32 bytes (sha2-512 code) does not even start with "Qm".
    expect(
      toCidV1Base32Label("S5cfs8ea4q9536UEetnCwUwN2xE4ZkXo37S8BJzyPFAWEW")
    ).toBeNull();
    // 0x12 0x20 + 32 zero bytes is a well-formed CIDv0.
    expect(
      toCidV1Base32Label("QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51")
    ).toMatch(/^bafybei[a-z2-7]{52}$/);
  });

  it("rejects a CIDv1 that does not fit one DNS label", () => {
    // CIDv1 dag-pb with a 64-byte sha2-512 digest: 106 characters.
    const bytes = [0x01, 0x70, 0x13, 0x40, ...Array<number>(64).fill(7)];
    const longCid = `b${encodeBase32(bytes)}`;
    expect(longCid.length).toBeGreaterThan(63);
    expect(toCidV1Base32Label(longCid)).toBeNull();
  });

  it("rejects a CIDv1 with an unsupported version", () => {
    const bytes = [0x02, 0x70, 0x12, 0x20, ...Array<number>(32).fill(1)];
    expect(toCidV1Base32Label(`b${encodeBase32(bytes)}`)).toBeNull();
  });

  it("rejects a CIDv1 whose digest length does not match", () => {
    const bytes = [0x01, 0x70, 0x12, 0x21, ...Array<number>(32).fill(1)];
    expect(toCidV1Base32Label(`b${encodeBase32(bytes)}`)).toBeNull();
  });

  it("accepts a well-formed CIDv1 with another hash function", () => {
    // blake2b-256 (0xb220) multihash, 32-byte digest.
    const bytes = [0x01, 0x55, 0xa0, 0xe4, 0x02, 0x20, ...Array<number>(32).fill(9)];
    const cid = `b${encodeBase32(bytes)}`;
    expect(toCidV1Base32Label(cid)).toBe(cid);
  });
});

function encodeBase32(bytes: readonly number[]): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let bits = "";
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let output = "";
  for (let index = 0; index < bits.length; index += 5) {
    output += alphabet[Number.parseInt(bits.slice(index, index + 5).padEnd(5, "0"), 2)];
  }
  return output;
}
