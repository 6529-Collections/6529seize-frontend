jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";
import { getCurrentMetadataEditorialMarkdown } from "@/lib/public-review/streamReviewMetadataPage";

async function loadMetadataEditorial() {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  if (reviewVersion === undefined) {
    throw new Error("The active Stream review version is unavailable.");
  }
  const page = reviewVersion.pages.find(
    (candidate) => candidate.id === "metadata-scripts-and-dependencies"
  );
  if (page === undefined) {
    throw new Error("The metadata test page is unavailable.");
  }
  return {
    editorialMarkdown: await loadStreamEditorialContent(
      page,
      reviewVersion.version
    ),
    source: reviewVersion.source,
  };
}

describe("getCurrentMetadataEditorialMarkdown", () => {
  it("replaces the real editorial snapshot with the current plain-language page", async () => {
    const input = await loadMetadataEditorial();

    for (const locale of SUPPORTED_LOCALES) {
      const currentMarkdown = getCurrentMetadataEditorialMarkdown({
        ...input,
        locale,
      });

      expect(currentMarkdown).toContain("## One-minute explanation");
      expect(currentMarkdown).toContain("### What the pinned code does");
      expect(currentMarkdown).toContain("### What the accepted design says");
      expect(currentMarkdown).toContain("### What is still open");
      expect(currentMarkdown).toContain(
        "This public review is not proof of launch, deployment, audit, or safety."
      );
      expect(currentMarkdown).toContain(
        "no matching public or external helper exists in the pinned Solidity"
      );
      expect(currentMarkdown).toContain(
        "A snapshot does not freeze the underlying records."
      );
      expect(currentMarkdown).not.toContain(
        "For digital art, metadata can be the recipe for reconstructing the work"
      );
    }
  });

  it("builds evidence links from the current source context", async () => {
    const input = await loadMetadataEditorial();
    const repository = "example/Stream";
    const commit = "a".repeat(40);

    const currentMarkdown = getCurrentMetadataEditorialMarkdown({
      ...input,
      source: { repository, commit },
    });

    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamMetadataRenderer.sol#L51-L383`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/docs/adr/0006-metadata-freeze.md#L96-L145`
    );
    expect(currentMarkdown).not.toContain(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
  });

  it("fails loudly when a required source heading changes", async () => {
    const input = await loadMetadataEditorial();
    const changedEditorial = input.editorialMarkdown.replace(
      "## Refresh events tell consumers that state changed",
      "## Metadata refresh events"
    );

    expect(() =>
      getCurrentMetadataEditorialMarkdown({
        ...input,
        editorialMarkdown: changedEditorial,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: metadata section: Refresh events tell consumers that state changed."
    );
  });

  it("fails loudly when unexpected source content follows the reviewed ending", async () => {
    const input = await loadMetadataEditorial();

    expect(() =>
      getCurrentMetadataEditorialMarkdown({
        ...input,
        editorialMarkdown: `${input.editorialMarkdown}\n## Appendix\n\nNew source content.`,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: metadata page ending."
    );
  });
});
