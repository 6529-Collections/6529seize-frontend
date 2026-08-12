jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import { getCurrentCurationTdhEditorialMarkdown } from "@/lib/public-review/streamReviewCurationTdhPage";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";

async function loadCurationTdhEditorial() {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  if (reviewVersion === undefined) {
    throw new Error("The active Stream review version is unavailable.");
  }
  const page = reviewVersion.pages.find(
    (candidate) => candidate.id === "curation-and-tdh-authorization"
  );
  if (page === undefined) {
    throw new Error("The curation and TDH test page is unavailable.");
  }
  return {
    editorialMarkdown: await loadStreamEditorialContent(
      page,
      reviewVersion.version
    ),
    source: reviewVersion.source,
  };
}

describe("getCurrentCurationTdhEditorialMarkdown", () => {
  it("renders the plain current explanation for every supported locale", async () => {
    const input = await loadCurationTdhEditorial();

    for (const locale of SUPPORTED_LOCALES) {
      const currentMarkdown = getCurrentCurationTdhEditorialMarkdown({
        ...input,
        locale,
      });

      expect(currentMarkdown).toContain("**The answer in one minute**");
      expect(currentMarkdown).toContain(
        "The contract does **not** choose the artist, calculate TDH, or decide whether the community process was fair."
      );
      expect(currentMarkdown).toContain(
        "One used permission therefore covers one token."
      );
      expect(currentMarkdown).toContain(
        "There is no grace period in this code."
      );
      expect(currentMarkdown).toContain(
        "ADR 0001"
      );
      expect(currentMarkdown).toContain(
        "The pinned Solidity, not ADR status, proves the current behavior."
      );
      expect(currentMarkdown).toContain(
        "offchain, time-weighted measure"
      );
      expect(currentMarkdown).toContain(
        "The current path first checks the [**DROP_EXECUTION** pause in **mintDrop**]"
      );
      expect(currentMarkdown).toContain(
        "**Still open as a product and operations requirement:**"
      );
      expect(currentMarkdown).not.toContain(
        "Stream converts a social curation decision into a cryptographically bound action."
      );
    }
  });

  it("keeps the existing section anchors for feedback links", async () => {
    const input = await loadCurationTdhEditorial();
    const currentMarkdown = getCurrentCurationTdhEditorialMarkdown(input);

    expect(
      extractPublicReviewSections(currentMarkdown).map((section) => section.id)
    ).toEqual(
      extractPublicReviewSections(input.editorialMarkdown).map(
        (section) => section.id
      )
    );
  });

  it("builds evidence links from the current source context", async () => {
    const input = await loadCurationTdhEditorial();
    const repository = "example/Stream";
    const commit = "a".repeat(40);

    const currentMarkdown = getCurrentCurationTdhEditorialMarkdown({
      ...input,
      source: { repository, commit },
    });

    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamDrops.sol#L24-L60`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamDrops.sol#L736-L785`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/docs/adr/0001-drop-authorization.md`
    );
    expect(currentMarkdown).not.toContain(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
  });

  it("fails loudly when the immutable source editorial changes", async () => {
    const input = await loadCurationTdhEditorial();

    expect(() =>
      getCurrentCurationTdhEditorialMarkdown({
        ...input,
        editorialMarkdown: `${input.editorialMarkdown}\nChanged source.`,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: curation and TDH authorization."
    );
  });
});
