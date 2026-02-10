import { COLLECTED_COLLECTIONS_META, convertAddressToLowerCase } from "@/components/user/collected/filters/user-page-collected-filters.helpers";
import { CollectedCollectionType, CollectionSort } from "@/entities/IProfile";

describe("COLLECTED_COLLECTIONS_META", () => {
  it("contains correct metadata for MEMES", () => {
    const memes = COLLECTED_COLLECTIONS_META[CollectedCollectionType.MEMES];
    expect(memes.label).toBe("The Memes");
    expect(memes.showCardDataRow).toBe(true);
    expect(memes.dataRows.seizedCount).toBe(true);
    expect(memes.filters.seized).toBe(true);
    expect(memes.filters.szn).toBe(true);
    expect(memes.filters.sort).toEqual([
      CollectionSort.TOKEN_ID,
      CollectionSort.TDH,
      CollectionSort.RANK,
    ]);
    expect(memes.cardPath).toBe("/the-memes");
  });

  it("contains correct metadata for MEMELAB", () => {
    const memelab = COLLECTED_COLLECTIONS_META[CollectedCollectionType.MEMELAB];
    expect(memelab.showCardDataRow).toBe(false);
    expect(memelab.dataRows.seizedCount).toBe(true);
    expect(memelab.filters.seized).toBe(false);
    expect(memelab.filters.szn).toBe(false);
    expect(memelab.filters.sort).toEqual([CollectionSort.TOKEN_ID]);
    expect(memelab.cardPath).toBe("/meme-lab");
  });
});

describe("convertAddressToLowerCase", () => {
  it("lowercases valid address strings", () => {
    expect(convertAddressToLowerCase("0xABCDEF")).toBe("0xabcdef");
  });

  it("returns null for non-string values", () => {
    expect(convertAddressToLowerCase(undefined as any)).toBeNull();
    expect(convertAddressToLowerCase(123 as any)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(convertAddressToLowerCase("")).toBeNull();
  });
});
