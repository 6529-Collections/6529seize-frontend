jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import { getCurrentDevelopmentEditorialMarkdown } from "@/lib/public-review/streamReviewDevelopmentPage";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";

async function loadDevelopmentEditorial() {
  const reviewVersion = getStreamReviewVersion(
    STREAM_REVIEW_DEFINITION.activeVersion
  );
  const page = reviewVersion?.pages.find(
    (candidate) =>
      candidate.id === "security-testing-and-known-limitations"
  );
  if (page === undefined) {
    throw new Error("The development test page is unavailable.");
  }
  return {
    editorialMarkdown: await loadStreamEditorialContent(
      page,
      reviewVersion.version
    ),
    source: {
      ...reviewVersion.source,
      tree: "b50ec53109f5f8d6b4f4b07f4cb6fd3c1d0e3100",
    },
  };
}

describe("getCurrentDevelopmentEditorialMarkdown", () => {
  it("applies every current-page replacement to the real editorial snapshot", async () => {
    const input = await loadDevelopmentEditorial();

    const currentMarkdown = getCurrentDevelopmentEditorialMarkdown(input);

    expect(currentMarkdown).toContain("## What this review covers");
    expect(currentMarkdown).toContain("## What works in the reviewed flow");
    expect(currentMarkdown).toContain("## What counts as proof");
    expect(currentMarkdown).not.toContain("## Working in the rehearsal");
    expect(currentMarkdown).not.toContain("## Connected for integration");
  });

  it("fails loudly when a required source section no longer matches", async () => {
    const input = await loadDevelopmentEditorial();
    const changedEditorial = input.editorialMarkdown.replace(
      "## Connected for integration",
      "## Connected systems"
    );

    expect(() =>
      getCurrentDevelopmentEditorialMarkdown({
        ...input,
        editorialMarkdown: changedEditorial,
      })
    ).toThrow(
      "The current Stream review editorial transformation is out of date: development working section."
    );
  });

  it("builds evidence and community links from the current source context", async () => {
    const input = await loadDevelopmentEditorial();
    const repository = "example/Stream";
    const commit = "a".repeat(40);

    const currentMarkdown = getCurrentDevelopmentEditorialMarkdown({
      ...input,
      source: {
        ...input.source,
        repository,
        commit,
      },
    });

    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/ops/SLITHER_BASELINE.json`
    );
    expect(currentMarkdown).toContain(
      `https://github.com/${repository}/blob/${commit}/release-artifacts/latest/bytecode-release-proof.json`
    );
    expect(currentMarkdown).toContain(
      "./community-review#before-reporting-a-security-issue"
    );
    expect(currentMarkdown).not.toContain(
      "#public-conduct-and-sensitive-information"
    );
  });
});
