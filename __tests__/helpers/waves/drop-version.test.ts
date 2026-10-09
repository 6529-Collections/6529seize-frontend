import { isOlderDropVersion } from "@/helpers/waves/drop-version";

describe("drop content revisions", () => {
  it.each([{ updated_at: null }, {}])(
    "rejects an unedited snapshot (%s) after an edit",
    (incoming) => {
      expect(isOlderDropVersion(incoming, { updated_at: 2000 })).toBe(true);
    }
  );
  it("accepts equal revisions carrying new reactions and votes", () => {
    expect(isOlderDropVersion({ updated_at: 2000 }, { updated_at: 2000 })).toBe(
      false
    );
  });
  it("accepts a first edit and snapshots when no edit has been observed", () => {
    expect(isOlderDropVersion({ updated_at: 2000 }, { updated_at: null })).toBe(
      false
    );
    expect(isOlderDropVersion({ updated_at: null }, { updated_at: null })).toBe(
      false
    );
  });
});
