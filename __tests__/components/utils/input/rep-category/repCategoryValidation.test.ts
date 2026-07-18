import { getRepCategoryViolation } from "@/components/utils/input/rep-category/repCategoryValidation";
import { t } from "@/i18n/messages";

describe("getRepCategoryViolation", () => {
  it("returns null for valid categories", () => {
    for (const category of [
      "Solidity Programming",
      "History of Carthage, vol. 1 (annotated)?!'",
      "Ω 木 mixed unicode",
    ]) {
      expect(getRepCategoryViolation(category)).toBeNull();
    }
  });

  it("rejects dashes, matching the backend pattern", () => {
    // The backend REP_CATEGORY_PATTERN excludes the dash entirely, so a
    // category containing one anywhere is a disallowed-character violation —
    // catch it here rather than let it 400 on submit.
    expect(getRepCategoryViolation("hey-jude")).toEqual({
      key: "rep.categories.validation.disallowedChars",
      params: { chars: '"-"' },
    });
    expect(getRepCategoryViolation("-Unreliable")).toEqual({
      key: "rep.categories.validation.disallowedChars",
      params: { chars: '"-"' },
    });
  });

  it("names the length rule with the actual count in code points", () => {
    expect(getRepCategoryViolation("a".repeat(101))).toEqual({
      key: "rep.categories.validation.tooLong",
      params: { length: 101, max: 100 },
    });
  });

  it("lists the exact disallowed characters once each", () => {
    expect(getRepCategoryViolation("web3:expert/artist:2")).toEqual({
      key: "rep.categories.validation.disallowedChars",
      params: { chars: '":", "/"' },
    });
  });

  it("labels invisible characters by locale-neutral code point", () => {
    const violation = getRepCategoryViolation("line\nbreak\ttab");
    // \n -> U+000A, \t -> U+0009 (no English words baked into the message).
    expect(violation?.params?.["chars"]).toBe("U+000A, U+0009");
  });

  it("labels a zero-width space by code point rather than empty quotes", () => {
    const violation = getRepCategoryViolation("gm​gm");
    expect(violation?.params?.["chars"]).toBe("U+200B");
  });

  it("every violation key resolves to a real en-US message", () => {
    for (const category of ["-x", "a".repeat(101), "a:b"]) {
      const violation = getRepCategoryViolation(category);
      expect(violation).not.toBeNull();
      const message = t(
        "en-US",
        violation!.key,
        violation!.params ? { ...violation!.params } : {}
      );
      expect(message.length).toBeGreaterThan(0);
      // No unresolved {placeholders} left behind.
      expect(message).not.toMatch(/\{\w+\}/);
    }
  });
});
