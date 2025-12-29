import { parseTokenIds } from "@/components/waves/memes/submission/utils/tokenParsing";

describe("tokenParsing", () => {
  describe("parseTokenIds", () => {
    it("should parse a single ID", () => {
      expect(parseTokenIds("1")).toEqual([1]);
    });

    it("should parse a list of IDs", () => {
      expect(parseTokenIds("1,2,3")).toEqual([1, 2, 3]);
    });

    it("should parse a range of IDs", () => {
      expect(parseTokenIds("1-3")).toEqual([1, 2, 3]);
    });

    it("should parse a mix of lists and ranges", () => {
      expect(parseTokenIds("1,3-5,7")).toEqual([1, 3, 4, 5, 7]);
    });

    it("should handle spaces and extra commas", () => {
      expect(parseTokenIds(" 1 , 3 - 5 ,, 7 ")).toEqual([1, 3, 4, 5, 7]);
    });

    it("should return empty array for empty input", () => {
      expect(parseTokenIds("")).toEqual([]);
      expect(parseTokenIds("   ")).toEqual([]);
    });

    it("should handle large ranges", () => {
      expect(parseTokenIds("100-102")).toEqual([100, 101, 102]);
    });

    it("should ignore invalid segments", () => {
      expect(parseTokenIds("1, abc, 3")).toEqual([1, 3]);
    });
  });
});
