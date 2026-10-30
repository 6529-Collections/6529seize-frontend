jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { cpSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  loadStreamEditorialContent,
  PublicReviewEditorialContentError,
} from "@/lib/public-review/editorialContent";
import {
  getStreamReviewVersion,
  STREAM_REVIEW_AUGUST_VERSION,
} from "@/lib/public-review/streamReviewDefinition";

const VERSIONS = path.join(
  "content",
  "public-reviews",
  "6529-stream",
  "versions"
);

function augustPage() {
  const reviewVersion = getStreamReviewVersion(STREAM_REVIEW_AUGUST_VERSION);
  const page = reviewVersion?.pages[0];
  if (!reviewVersion || !page) {
    throw new Error("The August Stream review fixture is unavailable.");
  }
  return { page, version: reviewVersion.version };
}

describe("Stream editorial content in the desktop app", () => {
  afterEach(() => {
    delete process.env["DESKTOP_RENDERER_DIR"];
  });

  it("reads from the frontend folder the app names, even after import", async () => {
    const { page, version } = augustPage();
    const frontend = mkdtempSync(path.join(os.tmpdir(), "frontend-root-"));
    try {
      cpSync(
        path.join(process.cwd(), VERSIONS, version),
        path.join(frontend, VERSIONS, version),
        {
          recursive: true,
        }
      );
      process.env["DESKTOP_RENDERER_DIR"] = frontend;

      const markdown = await loadStreamEditorialContent(page, version);

      expect(markdown.length).toBeGreaterThan(0);
    } finally {
      rmSync(frontend, { recursive: true, force: true });
    }
  });

  it("does not fall back to the working folder when the named folder lacks the content", async () => {
    const { page, version } = augustPage();
    const empty = mkdtempSync(path.join(os.tmpdir(), "frontend-root-"));
    try {
      process.env["DESKTOP_RENDERER_DIR"] = empty;

      await expect(
        loadStreamEditorialContent(page, version)
      ).rejects.toBeInstanceOf(PublicReviewEditorialContentError);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
