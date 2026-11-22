import { hashTypedData, keccak256, sha256 } from "viem";
import {
  domainSeparator,
  encodeType,
  hashStruct,
  typedDataDigest,
} from "@/lib/chain/codec/eip712";
import { bytes32, struct, u32 } from "@/lib/chain/codec/schema";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  decodeProfileDoc,
  matchesCid,
  prepareProfileDoc,
  profileDocumentTypedData,
  signedProfileDoc,
} from "@/lib/chain-identity/profileDoc";

const PRINCIPAL = `0x${"0a".repeat(32)}` as const;
const NONCE = `0x${"0b".repeat(32)}` as const;
const NETWORK = `0x${"0c".repeat(32)}` as const;
const KEY_ID = `0x${"0d".repeat(32)}` as const;
const SIGNATURE = `0x${"0e".repeat(64)}` as const;

const doc = (fields: Record<string, string>, version = 2) => ({
  principal: PRINCIPAL,
  version,
  prev: "0x" as const,
  fields: new Map(Object.entries(fields)),
});

const lengthPrefixed = (text: string): string => {
  const raw = Buffer.from(text);
  return raw.length.toString(16).padStart(8, "0") + raw.toString("hex");
};

const signed = (fields: Record<string, string>, version = 2) => {
  const { unsigned, docHash } = prepareProfileDoc(doc(fields, version), NONCE);
  return {
    unsigned,
    docHash,
    ...signedProfileDoc(unsigned, {
      keyType: 2,
      keyId: KEY_ID,
      signature: SIGNATURE,
    }),
  };
};

it("writes the bytes before the signature as the import's builder does", () => {
  const { unsigned, docHash } = prepareProfileDoc(
    doc({ bio: "gm", avatar: "ipfs://a" }, 1),
    NONCE
  );
  const expected =
    lengthPrefixed("6529.ProfileDoc.v1") +
    "0a".repeat(32) +
    "00000001" +
    "00000000" +
    "0b".repeat(32) +
    "00000002" +
    lengthPrefixed("avatar") +
    lengthPrefixed("ipfs://a") +
    lengthPrefixed("bio") +
    lengthPrefixed("gm");
  expect(Buffer.from(unsigned).toString("hex")).toBe(expected);
  expect(docHash).toBe(keccak256(unsigned));
});

it("appends the signature as CE (keyType, keyId, signature)", () => {
  const { unsigned, bytes } = signed({ bio: "gm" });
  const tail = Buffer.from(bytes.slice(unsigned.length)).toString("hex");
  const sig = "02" + "0d".repeat(32) + "00000040" + "0e".repeat(64);
  expect(tail).toBe((sig.length / 2).toString(16).padStart(8, "0") + sig);
});

it("names the signed document by CIDv1, raw codec, sha2-256", () => {
  const { bytes, cid } = signed({ bio: "gm" });
  expect(cid).toBe(`0x01551220${sha256(bytes).slice(2)}`);
  expect(matchesCid(bytes, cid)).toBe(true);
  expect(matchesCid(bytes, `0x01551220${"00".repeat(32)}`)).toBe(false);
});

it("signs ProfileDocument(principal, version, docHash) in the 6529 Network domain", () => {
  // Built with the chain codec's own EIP-712 code, apart from viem.
  const PROFILE_DOCUMENT = struct("ProfileDocument", [
    ["principal", bytes32],
    ["version", u32],
    ["docHash", bytes32],
  ]);
  expect(encodeType(PROFILE_DOCUMENT)).toBe(
    "ProfileDocument(bytes32 principal,uint32 version,bytes32 docHash)"
  );
  const expected = typedDataDigest(
    domainSeparator({ name: "6529 Network", version: "1", salt: NETWORK }),
    hashStruct(PROFILE_DOCUMENT, {
      principal: PRINCIPAL,
      version: 3,
      docHash: KEY_ID,
    })
  );
  expect(
    hashTypedData(profileDocumentTypedData(NETWORK, PRINCIPAL, 3, KEY_ID))
  ).toBe(expected);
});

it("keeps values exactly as given, whitespace included", () => {
  const { bytes } = signed({ bio: "gm\n", displayName: " punk " });
  const decoded = decodeProfileDoc(bytes);
  expect(decoded?.fields.get("bio")).toBe("gm\n");
  expect(decoded?.fields.get("displayName")).toBe(" punk ");
});

it("refuses a document over 524,288 bytes before anything is signed", () => {
  const big = { bio: "x".repeat(65_536), a: "x".repeat(65_536), b: "x".repeat(65_536), c: "x".repeat(65_536), d: "x".repeat(65_536), e: "x".repeat(65_536), f: "x".repeat(65_536), g: "x".repeat(65_536) };
  expect(() => prepareProfileDoc(doc(big), NONCE)).toThrow(
    new ChainOperationError(
      "rejected",
      "Your profile would be larger than 524,288 bytes, so it wasn't changed."
    )
  );
  // Exactly at the limit with a wallet's signature: accepted; a byte more
  // is refused before signing.
  const wallet = { keyType: 1, keyId: KEY_ID, signature: `0x${"11".repeat(65)}` } as const;
  // Seven full fields (65,536 bytes each, the codec's most) and an eighth
  // sized to land exactly on the limit.
  const full = Object.fromEntries(
    ["a", "b", "c", "d", "e", "f", "g"].map((key) => [key, "x".repeat(65_536)])
  );
  const withLast = (length: number) => doc({ ...full, h: "x".repeat(length) });
  const probe = prepareProfileDoc(withLast(60_000), NONCE);
  const sigLength =
    signedProfileDoc(probe.unsigned, wallet).bytes.length - probe.unsigned.length - 4;
  const last = 524_288 - 4 - sigLength - (probe.unsigned.length - 60_000);
  const fits = prepareProfileDoc(withLast(last), NONCE);
  expect(signedProfileDoc(fits.unsigned, wallet).bytes.length).toBe(524_288);
  expect(() => prepareProfileDoc(withLast(last + 1), NONCE)).toThrow(
    ChainOperationError
  );
  // And signedProfileDoc still refuses bytes past the limit.
  expect(() =>
    signedProfileDoc(new Uint8Array(524_288), {
      keyType: 2,
      keyId: KEY_ID,
      signature: SIGNATURE,
    })
  ).toThrow(ChainOperationError);
});

it("leaves out empty values, sorts keys bytewise and keeps unknown keys", () => {
  const { bytes } = signed({
    website: "https://example.test",
    bio: "",
    banner1: "#000000",
    "cms.archive": "bafkexample",
  });
  const decoded = decodeProfileDoc(bytes);
  expect([...(decoded?.fields.keys() ?? [])]).toEqual([
    "banner1",
    "cms.archive",
    "website",
  ]);
});

it("reads back what it writes", () => {
  const { bytes } = signed(
    { "statement.SOCIAL_MEDIA_ACCOUNT.X.0": "@gm", bio: "hello" },
    7
  );
  const decoded = decodeProfileDoc(bytes);
  expect(decoded?.version).toBe(7);
  expect(decoded?.principal).toBe(PRINCIPAL);
  expect(decoded?.fields.get("bio")).toBe("hello");
  expect(decoded?.fields.get("statement.SOCIAL_MEDIA_ACCOUNT.X.0")).toBe("@gm");
});

it("reads other bytes as no document", () => {
  expect(decodeProfileDoc(new Uint8Array([1, 2, 3]))).toBeNull();
});
