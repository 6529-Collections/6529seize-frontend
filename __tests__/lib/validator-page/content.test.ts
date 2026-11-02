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

  it("keeps the owner's line word for word and names the DM account", () => {
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain(
      "6529 never starts a DM with you or asks for a seed phrase."
    );
    expect(VALIDATOR_GUIDE_MARKDOWN).toContain("6529validators");
  });
});
