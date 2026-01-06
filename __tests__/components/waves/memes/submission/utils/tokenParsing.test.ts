import { validateTokenIdFormat } from "@/components/waves/memes/submission/utils/tokenParsing";

describe("tokenParsing", () => {
  describe("validateTokenIdFormat", () => {
    it("should return null for valid single ID", () => {
      expect(validateTokenIdFormat("1")).toBeNull();
    });

    it("should return null for valid list of IDs", () => {
      expect(validateTokenIdFormat("1,2,3")).toBeNull();
    });

    it("should return null for valid range", () => {
      expect(validateTokenIdFormat("1-5")).toBeNull();
    });

    it("should return null for valid mix of lists and ranges", () => {
      expect(validateTokenIdFormat("1,3-5,7")).toBeNull();
    });

    it("should return null for empty input", () => {
      expect(validateTokenIdFormat("")).toBeNull();
      expect(validateTokenIdFormat("   ")).toBeNull();
    });

    it("should return error for invalid ID", () => {
      expect(validateTokenIdFormat("abc")).toBe("Invalid token ID. Use: 1,2,5-10");
    });

    it("should return error for invalid range format", () => {
      expect(validateTokenIdFormat("1-2-3")).toBe("Invalid range format. Use: 1-5");
    });

    it("should return error for non-numeric range", () => {
      expect(validateTokenIdFormat("a-b")).toBe("Invalid range. Use numbers only: 1-5");
    });

    it("should return error for partial invalid input", () => {
      expect(validateTokenIdFormat("1,abc,3")).toBe("Invalid token ID. Use: 1,2,5-10");
    });
  });
});
