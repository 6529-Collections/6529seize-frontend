import fixture from "@/__tests__/fixtures/stream/r8-independent-start.json";
import {
  buildItem,
  encodeIndependentMint,
  itemFromStartCalldata,
  itemHashOf,
  ITEM_KIND,
  mediaHashOf,
} from "@/lib/stream/item";
import type { Hex } from "viem";

describe("6529 Works item encoding", () => {
  const decoded = itemFromStartCalldata(fixture.input as Hex, false);

  it("reads the item back out of an Independent Stream start on r8", () => {
    expect(decoded).not.toBeNull();
    expect(decoded?.item.kind).toBe(ITEM_KIND.EDITION_MASTER);
    expect(decoded?.media).toHaveLength(1);
  });

  it("hashes the item exactly as the contract stored it", () => {
    expect(itemHashOf(decoded!.item)).toBe(fixture.itemHash);
  });

  it("encodes the mint request the same way the start sent it", () => {
    const encoded = encodeIndependentMint(decoded!.item, decoded!.media);
    expect(fixture.input.toLowerCase()).toContain(encoded.slice(2).toLowerCase());
  });

  it("rebuilds the same item from its parts", () => {
    const item = decoded!.item;
    const rebuilt = buildItem({
      artist: item.parties[0]!.account,
      collectionId: item.collectionId,
      contentHash: item.contentHash,
      primaryFileId: decoded!.media[0]!.fileId,
      recordFileId: item.recordFileId,
      cc0TextFileId: item.license.textFileId,
      edition: { maxCount: item.edition.maxCount },
    });
    expect(rebuilt.mediaHash).toBe(mediaHashOf(decoded!.media));
    expect(itemHashOf(rebuilt)).toBe(fixture.itemHash);
  });

  it("ignores calldata of other calls", () => {
    expect(itemFromStartCalldata("0x12345678", false)).toBeNull();
  });
});
