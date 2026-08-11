jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import { getCurrentArtworkLifecycleEditorialMarkdown } from "@/lib/public-review/streamReviewArtworkLifecyclePage";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";

async function loadArtworkLifecycleEditorial() {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  if (reviewVersion === undefined) {
    throw new Error("The active Stream review version is unavailable.");
  }
  const page = reviewVersion.pages.find(
    (candidate) => candidate.id === "artwork-lifecycle"
  );
  if (page === undefined) {
    throw new Error("The artwork lifecycle test page is unavailable.");
  }
  return {
    editorialMarkdown: await loadStreamEditorialContent(
      page,
      reviewVersion.version
    ),
    source: reviewVersion.source,
  };
}

describe("getCurrentArtworkLifecycleEditorialMarkdown", () => {
  it("applies every current-page replacement to the real editorial snapshot", async () => {
    const input = await loadArtworkLifecycleEditorial();

    for (const locale of SUPPORTED_LOCALES) {
      const currentMarkdown = getCurrentArtworkLifecycleEditorialMarkdown({
        ...input,
        locale,
      });

      expect(currentMarkdown).toContain(
        "## 2. The artwork package is prepared"
      );
      expect(currentMarkdown).toContain(
        "## 8. Randomness is requested and recorded"
      );
      expect(currentMarkdown).not.toContain(
        "A Stream artwork moves through a sequence of deliberate commitments."
      );
      expect(currentMarkdown).not.toContain(
        "## 8. Randomness enters a recorded lifecycle"
      );
    }
  });

  it("builds contract links from the current source context", async () => {
    const input = await loadArtworkLifecycleEditorial();
    const repository = "example/Stream";
    const commit = "a".repeat(40);

    const currentMarkdown = getCurrentArtworkLifecycleEditorialMarkdown({
      ...input,
      source: { repository, commit },
    });

    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamCore.sol#L336`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamMintManager.sol`
    );
    expect(currentMarkdown).not.toContain(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
  });

  it("fails loudly when a required source section no longer matches", async () => {
    const input = await loadArtworkLifecycleEditorial();
    const changedEditorial = input.editorialMarkdown.replace(
      "## 4. A distribution policy is selected",
      "## 4. Distribution policy"
    );

    expect(() =>
      getCurrentArtworkLifecycleEditorialMarkdown({
        ...input,
        editorialMarkdown: changedEditorial,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: distribution."
    );
  });
});
