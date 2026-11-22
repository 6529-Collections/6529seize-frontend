import { sha256 } from "viem";
import {
  decodeProfileDoc,
  encodeProfileDoc,
  matchesCid,
} from "@/lib/chain-identity/profileDoc";

const PRINCIPAL = `0x${"0a".repeat(32)}` as const;
const NONCE = `0x${"0b".repeat(32)}` as const;

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

it("writes the bytes the import's builder writes", () => {
  const { bytes } = encodeProfileDoc(
    doc({ bio: "gm", avatar: "ipfs://a" }, 1),
    NONCE
  );
  expect(Buffer.from(bytes).toString("hex")).toBe(
    lengthPrefixed("6529.ProfileDoc.v1") +
      "0a".repeat(32) +
      "00000001" +
      "00000000" +
      "0b".repeat(32) +
      "00000002" +
      lengthPrefixed("avatar") +
      lengthPrefixed("ipfs://a") +
      lengthPrefixed("bio") +
      lengthPrefixed("gm") +
      "00000000"
  );
});

it("names the document by CIDv1, raw codec, sha2-256", () => {
  const { bytes, cid } = encodeProfileDoc(doc({ bio: "gm" }), NONCE);
  expect(cid).toBe(`0x01551220${sha256(bytes).slice(2)}`);
  expect(matchesCid(bytes, cid)).toBe(true);
  expect(matchesCid(bytes, `0x01551220${"00".repeat(32)}`)).toBe(false);
});

it("leaves out empty values and sorts keys bytewise", () => {
  const { bytes } = encodeProfileDoc(
    doc({ website: "https://example.test", bio: "  ", banner1: "#000000" }),
    NONCE
  );
  const decoded = decodeProfileDoc(bytes);
  expect([...(decoded?.fields.keys() ?? [])]).toEqual(["banner1", "website"]);
});

it("reads back what it writes", () => {
  const { bytes } = encodeProfileDoc(
    doc({ "statement.SOCIAL_MEDIA_ACCOUNT.X.0": "@gm", bio: "hello" }, 7),
    NONCE
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
