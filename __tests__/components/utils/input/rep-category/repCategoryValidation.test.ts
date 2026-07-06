import { getRepCategoryViolation } from "@/components/utils/input/rep-category/repCategoryValidation";
import { t } from "@/i18n/messages";

describe("getRepCategoryViolation", () => {
  it("returns null for valid categories, including dashed ones", () => {
    for (const category of [
      "Solidity Programming",
      "hey-jude",
      "state-of-the-art",
      "History of Carthage, vol. 1 (annotated)?!'",
      "Ω-木 mixed unicode",
    ]) {
      expect(getRepCategoryViolation(category)).toBeNull();
    }
  });

  it("names the leading-dash rule", () => {
    expect(getRepCategoryViolation("-Unreliable")).toEqual({
      key: "rep.categories.validation.leadingDash",
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

  it("describes invisible characters by name", () => {
    const violation = getRepCategoryViolation("line\nbreak\ttab");
    expect(violation?.params?.["chars"]).toBe("line break, tab");
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
