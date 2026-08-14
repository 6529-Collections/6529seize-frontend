jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";
import { getCurrentTokensMintingEditorialMarkdown } from "@/lib/public-review/streamReviewTokensMintingPage";

async function loadTokensMintingEditorial() {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  if (reviewVersion === undefined) {
    throw new Error("The active Stream review version is unavailable.");
  }
  const page = reviewVersion.pages.find(
    (candidate) => candidate.id === "tokens-collections-and-minting"
  );
  if (page === undefined) {
    throw new Error("The tokens and minting test page is unavailable.");
  }
  return {
    editorialMarkdown: await loadStreamEditorialContent(
      page,
      reviewVersion.version
    ),
    source: reviewVersion.source,
  };
}

describe("getCurrentTokensMintingEditorialMarkdown", () => {
  it("applies the plain-language current copy for every supported locale", async () => {
    const input = await loadTokensMintingEditorial();

    for (const locale of SUPPORTED_LOCALES) {
      const currentMarkdown = getCurrentTokensMintingEditorialMarkdown({
        ...input,
        locale,
      });

      expect(currentMarkdown).toContain("## Minting in one minute");
      expect(currentMarkdown).toContain(
        "## One shared contract records every Stream NFT"
      );
      expect(currentMarkdown).toContain(
        "## The code has two separate ways to mint"
      );
      expect(currentMarkdown).toContain(
        "The two paths are both present, but they are not one combined launch path."
      );
      expect(currentMarkdown).toContain(
        "This ADR is only a proposal. It is not accepted or implemented in the pinned code."
      );
      expect(currentMarkdown).toContain(
        "`setFinalSupply` alone does not close an empty collection forever"
      );
      expect(currentMarkdown.match(/^## /gm)).toHaveLength(17);
      expect(currentMarkdown).not.toContain(
        "A Stream token carries a larger set of facts"
      );
      expect(currentMarkdown).not.toContain(
        "The current candidate's parallel lanes must be reconciled"
      );
    }
  });

  it("builds evidence links from the current source context", async () => {
    const input = await loadTokensMintingEditorial();
    const repository = "example/Stream";
    const commit = "b".repeat(40);

    const currentMarkdown = getCurrentTokensMintingEditorialMarkdown({
      ...input,
      source: { repository, commit },
    });

    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamCore.sol#L312-L352`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/docs/adr/0018-batch-operation-root-and-token-identity.md#L3-L33`
    );
    expect(currentMarkdown).not.toContain(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
  });

  it("fails loudly when a required source section no longer matches", async () => {
    const input = await loadTokensMintingEditorial();
    const changedEditorial = input.editorialMarkdown.replace(
      "## The two source mint lanes",
      "## Mint lanes"
    );

    expect(() =>
      getCurrentTokensMintingEditorialMarkdown({
        ...input,
        editorialMarkdown: changedEditorial,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: tokens and minting policy."
    );
  });

  it("fails loudly when unexpected source content follows the reviewed ending", async () => {
    const input = await loadTokensMintingEditorial();

    expect(() =>
      getCurrentTokensMintingEditorialMarkdown({
        ...input,
        editorialMarkdown: `${input.editorialMarkdown}\n## Appendix\n\nNew source content.`,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: tokens and minting ending."
    );
  });
});
