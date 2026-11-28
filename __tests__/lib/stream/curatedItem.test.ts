import { encodeFunctionData, type Hex } from "viem";

import vectors from "@/__tests__/fixtures/stream/r9-gate-vectors.json";
import r9Start from "@/__tests__/fixtures/stream/r9-curated-start.json";
import manifestVector from "@/__tests__/fixtures/stream/r9-manifest-vector.json";
import { saleStarterAbi } from "@/lib/stream/abis";
import { fileIdOf } from "@/lib/stream/create";
import {
  buildItem,
  encodeStreamMint,
  itemFromStartCalldata,
  itemHashOf,
  mediaHashOf,
  mediaListOf,
  oneItemPackageRoot,
} from "@/lib/stream/item";

// Answers recorded from r9's SepoliaOpenGate (oneItemPackage, mediaHashOf) for these drafts.
const draft = {
  artist: vectors.draft.artist as Hex,
  collectionId: BigInt(vectors.draft.collectionId),
  contentHash: vectors.draft.contentHash as Hex,
  primaryFileId: vectors.draft.primaryFileId as Hex,
  recordFileId: vectors.draft.recordFileId as Hex,
  cc0TextFileId: vectors.draft.cc0TextFileId as Hex,
};

describe("curated item hashing against the r9 gate", () => {
  it("matches oneItemPackage for an original", () => {
    const itemHash = itemHashOf(buildItem(draft));
    expect(itemHash).toBe(vectors.original.itemHash);
    expect(oneItemPackageRoot(itemHash)).toBe(vectors.original.packageRoot);
  });

  it("matches oneItemPackage for an edition master", () => {
    const itemHash = itemHashOf(buildItem({ ...draft, edition: { maxCount: vectors.master.maxCount ?? 0 } }));
    expect(itemHash).toBe(vectors.master.itemHash);
    expect(oneItemPackageRoot(itemHash)).toBe(vectors.master.packageRoot);
  });

  it("matches mediaHashOf", () => {
    expect(mediaHashOf(mediaListOf(draft))).toBe(vectors.mediaHash);
  });

  it("uses a given artist ID for the payee, else the address", () => {
    expect(buildItem(draft).payees[0]?.artistId).toBe(BigInt(draft.artist));
    expect(buildItem({ ...draft, artistId: 42n }).payees[0]?.artistId).toBe(42n);
  });
});

describe("encodeStreamMint", () => {
  it("round-trips through a SaleStarter.start calldata", () => {
    const item = buildItem({ ...draft, edition: { maxCount: 5 } });
    const media = mediaListOf(draft);
    const packageRoot = oneItemPackageRoot(itemHashOf(item));
    const request = encodeStreamMint({
      packageRoot,
      item,
      proof: [],
      nonce: 3n,
      deadline: 1_900_000_000n,
      signature: `0x${"ab".repeat(85)}`,
    });
    const calldata = encodeFunctionData({
      abi: saleStarterAbi,
      functionName: "start",
      args: ["0x7fEe60049548c6d89c0053D220eF1f631B0c76cF", "0xdbc691bb75C5477d2cdCF2c441219D31b32A8dd9", request, media],
    });
    const started = itemFromStartCalldata(calldata, true);
    expect(started?.packageRoot).toBe(packageRoot);
    expect(started?.proof).toEqual([]);
    expect(started?.media).toEqual(media);
    expect(itemHashOf(started!.item)).toBe(itemHashOf(item));
  });

  it("decodes the real r9 start of Meridian to the item the stream recorded", () => {
    const started = itemFromStartCalldata(r9Start.input as Hex, true);
    expect(started).not.toBeNull();
    const itemHash = itemHashOf(started!.item);
    expect(itemHash).toBe(r9Start.itemHashOnChain);
    expect(started!.packageRoot).toBe(oneItemPackageRoot(itemHash));
    expect(started!.item.collectionId).toBe(2n);
    expect(started!.item.edition.maxCount).toBe(5);
  });
});

describe("fileIdOf", () => {
  it("matches ContentStore.manifestId on r9", () => {
    const vector = manifestVector as {
      chunkHashes: Hex[];
      length: number;
      mimeType: string;
      sha256: Hex;
      fileId: Hex;
    };
    const file = {
      bytes: new Uint8Array(vector.length),
      chunks: [],
      chunkHashes: vector.chunkHashes,
      mimeType: vector.mimeType,
      sha256: vector.sha256,
    };
    expect(fileIdOf(file)).toBe(vector.fileId);
  });
});
