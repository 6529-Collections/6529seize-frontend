/** @jest-environment node */
import { VALIDATOR_GUIDE_MARKDOWN } from "@/lib/validator-page/content/guideMarkdown";
import { VALIDATOR_KNOWN_ISSUES_MARKDOWN } from "@/lib/validator-page/content/knownIssuesMarkdown";

describe("validator page text", () => {
  it.each([
    ["guide", VALIDATOR_GUIDE_MARKDOWN],
    ["known issues", VALIDATOR_KNOWN_ISSUES_MARKDOWN],
  ])(
    "the %s hold no addresses, placeholders or retired peer steps",
    (_name, text) => {
      // This repository is public: peer addresses stay off the page.
      expect(text).not.toMatch(/\/ip4\/|\/onion3\/|12D3Koo/);
      expect(text).not.toMatch(
        /\{\{|<SHORT_COMMIT>|<CHECK_DATE>|<HISTORY_MINUTES>/
      );
      expect(text).not.toMatch(/replace_bootstrap|peers add/);
      expect(text).not.toMatch(/\brc\.[1-4]\b/);
    }
  );

  it("gives every validator command per system, since the Mac app is not on the PATH", () => {
    const outsideTables = VALIDATOR_GUIDE_MARKDOWN.split("\n").filter(
      (line) => !line.startsWith("|")
    );
    expect(outsideTables.join("\n")).not.toMatch(
      /`validator (?:--version|update|status)/
    );
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain(
      '`"/Applications/6529 Validator.app/Contents/Resources/validator" update check`'
    );
  });

  it("shows rc.5's version line and its 23 known issues in order", () => {
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain(
      "`validator 0.1.0-rc.5 (29a8caf, TDH v1.4)`"
    );
    const numbers = VALIDATOR_KNOWN_ISSUES_MARKDOWN.split("\n")
      .map((line) => /^(\d+)\. /.exec(line)?.[1])
      .filter((value): value is string => value !== undefined)
      .map(Number);
    expect(numbers).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
    expect(VALIDATOR_KNOWN_ISSUES_MARKDOWN).toMatch(
      /^18\. On a Mac where the validator was set up as a system service/m
    );
  });

  it("keeps the owner's line word for word and names the DM account", () => {
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain(
      "6529 never starts a DM with you or asks for a seed phrase."
    );
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain("6529validators");
  });
});
