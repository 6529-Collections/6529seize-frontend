import {
  hasCurrentDropPartContent,
  shouldUseInitialDropConfig,
} from "@/components/waves/utils/createDropContentSubmission";

describe("createDropContentSubmission helpers", () => {
  describe("shouldUseInitialDropConfig", () => {
    it("returns true only when both markdown and files are empty", () => {
      expect(shouldUseInitialDropConfig(null, 0)).toBe(true);
      expect(shouldUseInitialDropConfig("", 0)).toBe(true);
    });

    it("returns false when markdown has text", () => {
      expect(shouldUseInitialDropConfig("hello", 0)).toBe(false);
      expect(shouldUseInitialDropConfig("https://opensea.io/item/1", 0)).toBe(
        false
      );
    });

    it("returns false when files are present", () => {
      expect(shouldUseInitialDropConfig(null, 1)).toBe(false);
      expect(shouldUseInitialDropConfig("hello", 1)).toBe(false);
    });
  });

  describe("hasCurrentDropPartContent", () => {
    it("returns true when markdown has non-whitespace content", () => {
      expect(hasCurrentDropPartContent("hello", 0)).toBe(true);
      expect(hasCurrentDropPartContent("  hello  ", 0)).toBe(true);
    });

    it("returns true when files exist even if markdown is empty or whitespace", () => {
      expect(hasCurrentDropPartContent(null, 1)).toBe(true);
      expect(hasCurrentDropPartContent("", 1)).toBe(true);
      expect(hasCurrentDropPartContent("   ", 1)).toBe(true);
    });

    it("returns false when both markdown and files are empty", () => {
      expect(hasCurrentDropPartContent(null, 0)).toBe(false);
      expect(hasCurrentDropPartContent("", 0)).toBe(false);
      expect(hasCurrentDropPartContent("   ", 0)).toBe(false);
    });
  });
});
