jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import { getCurrentArtworkLifecycleEditorialMarkdown } from "@/lib/public-review/streamReviewArtworkLifecyclePage";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";

async function loadArtworkLifecycleEditorial(): Promise<string> {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  const page = reviewVersion?.pages.find(
    (candidate) => candidate.id === "artwork-lifecycle"
  );
  if (page === undefined) {
    throw new Error("The artwork lifecycle test page is unavailable.");
  }
  return loadStreamEditorialContent(page, reviewVersion.version);
}

describe("getCurrentArtworkLifecycleEditorialMarkdown", () => {
  it("applies every current-page replacement to the real editorial snapshot", async () => {
    const editorialMarkdown = await loadArtworkLifecycleEditorial();

    for (const locale of SUPPORTED_LOCALES) {
      const currentMarkdown = getCurrentArtworkLifecycleEditorialMarkdown({
        editorialMarkdown,
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

  it("fails loudly when a required source section no longer matches", async () => {
    const editorialMarkdown = await loadArtworkLifecycleEditorial();
    const changedEditorial = editorialMarkdown.replace(
      "## 4. A distribution policy is selected",
      "## 4. Distribution policy"
    );

    expect(() =>
      getCurrentArtworkLifecycleEditorialMarkdown({
        editorialMarkdown: changedEditorial,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: distribution."
    );
  });
});
