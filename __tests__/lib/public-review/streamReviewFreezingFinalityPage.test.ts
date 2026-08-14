jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import { getCurrentFreezingFinalityEditorialMarkdown } from "@/lib/public-review/streamReviewFreezingFinalityPage";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";

async function loadFreezingFinalityEditorial() {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  if (reviewVersion === undefined) {
    throw new Error("The active Stream review version is unavailable.");
  }
  const page = reviewVersion.pages.find(
    (candidate) => candidate.id === "freezing-preservation-and-artwork-finality"
  );
  if (page === undefined) {
    throw new Error("The freezing and finality test page is unavailable.");
  }
  return {
    editorialMarkdown: await loadStreamEditorialContent(
      page,
      reviewVersion.version
    ),
    source: reviewVersion.source,
  };
}

describe("getCurrentFreezingFinalityEditorialMarkdown", () => {
  it("replaces the exact editorial snapshot for every supported locale", async () => {
    const input = await loadFreezingFinalityEditorial();

    for (const locale of SUPPORTED_LOCALES) {
      const currentMarkdown = getCurrentFreezingFinalityEditorialMarkdown({
        ...input,
        locale,
      });

      expect(currentMarkdown).toContain("## The answer in one minute");
      expect(currentMarkdown).toContain(
        "Finalizing supply by itself does not freeze the Core."
      );
      expect(currentMarkdown).toContain(
        "Burning a token does not lower this minted-ever count"
      );
      expect(currentMarkdown).toContain(
        "Only an authorized finality admin can execute the scheduled action."
      );
      expect(currentMarkdown).toContain(
        "It is proposed, not accepted or implemented in the pinned candidate."
      );
      expect(currentMarkdown).toContain(
        "Public review is not proof of launch, deployment, audit, or safety."
      );
      expect(currentMarkdown).not.toContain(
        "Layered finality exposes every live mint path"
      );
    }
  });

  it("builds evidence links from the pinned source context", async () => {
    const input = await loadFreezingFinalityEditorial();
    const repository = "example/Stream";
    const commit = "a".repeat(40);

    const currentMarkdown = getCurrentFreezingFinalityEditorialMarkdown({
      ...input,
      source: { repository, commit },
    });

    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamCore.sol#L888-L907`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/smart-contracts/StreamArtworkFinalityRegistry.sol#L297-L589`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/docs/adr/0020-executor-only-finality-recovery.md#L3-L24`
    );
    expect(currentMarkdown).not.toContain(
      "513bd7e079eafe109df6ae1ae21bfbca6fec6786"
    );
  });

  it("fails loudly when any saved source content changes", async () => {
    const input = await loadFreezingFinalityEditorial();
    const changedEditorial = input.editorialMarkdown.replace(
      "Final supply is a supply promise",
      "Final supply closes minting"
    );

    expect(() =>
      getCurrentFreezingFinalityEditorialMarkdown({
        ...input,
        editorialMarkdown: changedEditorial,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: freezing, preservation, and artwork finality."
    );
  });
});
