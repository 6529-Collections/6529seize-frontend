import { bytesToString, keccak256, sha256 } from "viem";
import { taggedHash } from "@/lib/chain/codec/ids";
import { chainGateway } from "@/lib/chain-identity/gateway";
import {
  DocClass,
  docBytes,
  docCid,
  docCommitment,
  freshDocNonce,
  storeDoc,
} from "@/lib/chain-waves/docs";

jest.mock("@/lib/chain-identity/gateway", () => ({
  chainGateway: { uploadDoc: jest.fn() },
}));

describe("off-chain documents", () => {
  it("are canonical JSON and a newline, keys sorted", () => {
    const bytes = docBytes({
      v: 1,
      kind: "wave",
      name: "Wave",
      chat: { b: 2, a: 1 },
    });
    expect(bytesToString(bytes)).toBe(
      '{"chat":{"a":1,"b":2},"kind":"wave","name":"Wave","v":1}\n'
    );
  });

  it("are named by a raw sha2-256 CIDv1", () => {
    const bytes = docBytes({ v: 1 });
    expect(docCid(bytes)).toBe(`0x01551220${sha256(bytes).slice(2)}`);
    expect(docCid(bytes)).toHaveLength(2 + 72);
  });

  it("commit with P40's OffchainDoc tag, class, nonce and keccak256", () => {
    const bytes = docBytes({ v: 1, kind: "entry" });
    const nonce = `0x${"ab".repeat(16)}${"00".repeat(16)}` as const;
    expect(docCommitment(DocClass.ENTRY_MANIFEST, nonce, bytes)).toBe(
      taggedHash("6529.OffchainDoc.v1", [
        { uint: 8, bits: 8 },
        { bytes32: nonce },
        { bytes32: keccak256(bytes) },
      ])
    );
  });

  it("take a fresh 128-bit nonce each time", () => {
    const one = freshDocNonce();
    const two = freshDocNonce();
    expect(one).toMatch(/^0x[0-9a-f]{32}0{32}$/);
    expect(one).not.toBe(two);
  });

  it("are kept in the gateway's store under their CID", async () => {
    const bytes = docBytes({ v: 1 });
    await expect(storeDoc(bytes)).resolves.toBe(docCid(bytes));
    expect(chainGateway.uploadDoc).toHaveBeenCalledWith(
      bytes,
      docCid(bytes),
      undefined
    );
  });
});
