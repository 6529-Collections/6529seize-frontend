import "next/dist/compiled/server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { PublicReviewPageDefinition } from "@/lib/public-review/publicReviewTypes";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

const STREAM_VERSIONS_ROOT = path.resolve(
  process.cwd(),
  "content",
  "public-reviews",
  "6529-stream",
  "versions"
);

export async function loadStreamEditorialContent(
  page: PublicReviewPageDefinition,
  version: string
): Promise<string> {
  if (!STREAM_REVIEW_DEFINITION.availableVersions.includes(version)) {
    throw new Error(`Unknown Stream review version: ${version}`);
  }

  const editorialRoot = path.resolve(
    STREAM_VERSIONS_ROOT,
    version,
    "editorial"
  );
  const contentPath = path.resolve(editorialRoot, page.editorialFile);
  const manifestPath = path.resolve(editorialRoot, "manifest.json");
  const relativePath = path.relative(editorialRoot, contentPath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath) ||
    !contentPath.endsWith(".md")
  ) {
    throw new Error(`Invalid Stream editorial path: ${page.editorialFile}`);
  }

  const [manifestSource, markdown] = await Promise.all([
    // Version and page are allowlisted above, and containment is checked.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    readFile(manifestPath, "utf8"),
    // Version and page are allowlisted above, and containment is checked.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    readFile(contentPath, "utf8"),
  ]);
  const manifest: unknown = JSON.parse(manifestSource);

  assertStreamEditorialManifest(manifest, version, page);
  return markdown;
}

function assertStreamEditorialManifest(
  manifest: unknown,
  version: string,
  page: PublicReviewPageDefinition
): void {
  if (!isRecord(manifest)) {
    throw new Error(`Invalid Stream editorial manifest for ${version}`);
  }

  const manifestPages = manifest["pages"];
  if (
    manifest["schema_version"] !== 1 ||
    manifest["review_id"] !== STREAM_REVIEW_SLUG ||
    manifest["review_version"] !== version ||
    manifest["source_commit"] !== STREAM_REVIEW_DEFINITION.source.commit ||
    !Array.isArray(manifestPages)
  ) {
    throw new Error(`Invalid Stream editorial manifest for ${version}`);
  }

  const manifestPage = (manifestPages as unknown[]).find(
    (candidate): candidate is StreamEditorialManifestPage =>
      isStreamEditorialManifestPage(candidate) && candidate.id === page.id
  );

  if (
    manifestPage?.title !== page.title ||
    manifestPage.file !== page.editorialFile
  ) {
    throw new Error(
      `Stream editorial manifest does not match page ${page.id} for ${version}`
    );
  }
}

interface StreamEditorialManifestPage {
  readonly id: string;
  readonly title: string;
  readonly file: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStreamEditorialManifestPage(
  value: unknown
): value is StreamEditorialManifestPage {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    typeof value["title"] === "string" &&
    typeof value["file"] === "string"
  );
}
