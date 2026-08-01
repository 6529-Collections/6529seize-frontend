import {
  isReservedMentionAlias,
  normalizeMentionAlias,
} from "@/helpers/mentions/mention-aliases.helpers";

describe("mention alias helpers", () => {
  it("normalizes aliases case-insensitively", () => {
    expect(normalizeMentionAlias("  @FrEnS ")).toBe("frens");
  });

  it.each([
    "@ALL",
    "Everyone",
    "ADMINS",
    "moderators",
    "contributors",
    "team",
    "6529DEVS",
    "DeVs6529",
  ])("reserves %s case-insensitively", (alias) => {
    expect(isReservedMentionAlias(alias)).toBe(true);
  });
});
