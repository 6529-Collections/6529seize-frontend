/** @jest-environment node */

jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import corrections from "@/lib/public-review/streamReviewEditorialCorrections.json";
import { getCurrentStreamEditorialMarkdown } from "@/lib/public-review/streamReviewEditorialCorrections";
import development from "@/i18n/messages/public-review-development-current.json";

interface KnowledgeRecord {
  id: string;
  category: string;
  text?: string;
  summary?: string;
  canonicalPath: string;
  kind: string;
  title: string;
  provenance: { sourceCommit: string };
  structured?: {
    summary: string;
    headline: string;
    checkedAt: string;
    state: string;
    evidenceSummary: {
      openReleaseBlockers: number;
      requirements: { complete: number; pending: number; missing: number };
    };
    beforeLaunch: { id: string; text: string }[];
    recentlyCompleted: { id: string; text: string }[];
    workingOn: { id: string; text: string }[];
  };
}

interface KnowledgePack {
  manifest: {
    counts: unknown;
    source: unknown;
    knowledgeSha256: string;
    currentView?: { sourceKnowledgeSha256: string };
  };
  records: KnowledgeRecord[];
  searchIndex: {
    records: { id: string; category: string; searchText: string }[];
  };
}

interface PackOptions {
  repoRoot: string;
  reviewId: string;
  reviewVersion: string;
  activeVersion?: string;
  knowledgeRootOverride?: string;
}

const { getStreamCurrentKnowledgeFiles } =
  require("../../scripts/public-reviews/stream-current-knowledge.cjs") as {
    getStreamCurrentKnowledgeFiles(options: PackOptions): Map<string, Buffer>;
  };
const { splitEditorialPage, validateKnowledgePack } =
  require("../../scripts/public-reviews/stream-knowledge.cjs") as {
    validateKnowledgePack(options: PackOptions): KnowledgePack;
    splitEditorialPage(options: {
      markdown: string;
      page: { id: string; title: string; file: string };
      reviewId: string;
      reviewVersion: string;
      sourceCommit: string;
    }): KnowledgeRecord[];
  };
const { assertPackagedKnowledge, directoryIdentity } =
  require("../../scripts/package-public-review-artifacts.cjs") as {
    assertPackagedKnowledge(
      source: string,
      bundle: string,
      files: Map<string, Buffer>,
      label: string
    ): void;
    directoryIdentity(root: string): string;
  };

const options = {
  repoRoot: process.cwd(),
  reviewId: corrections.reviewId,
  reviewVersion: corrections.reviewVersion,
  activeVersion: corrections.reviewVersion,
};
const sourceRoot = path.join(
  process.cwd(),
  "ops/public-review-knowledge",
  options.reviewId,
  "versions",
  options.reviewVersion,
  "knowledge"
);
let temporaryRoot: string;
let projectedRoot: string;
let files: Map<string, Buffer>;
let source: KnowledgePack;
let current: KnowledgePack;
let sourceIdentity: string;

beforeAll(() => {
  sourceIdentity = directoryIdentity(sourceRoot);
  source = validateKnowledgePack(options);
  files = getStreamCurrentKnowledgeFiles(options);
  temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "stream-current-knowledge-")
  );
  projectedRoot = path.join(temporaryRoot, "knowledge");
  fs.cpSync(sourceRoot, projectedRoot, { recursive: true });
  for (const [relativePath, buffer] of files) {
    fs.writeFileSync(path.join(projectedRoot, relativePath), buffer);
  }
  current = validateKnowledgePack({
    ...options,
    knowledgeRootOverride: projectedRoot,
  });
}, 60_000);

afterAll(() => {
  if (temporaryRoot) fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

it("uses exactly the UI's corrected English sections in active evidence", () => {
  const editorialRoot = path.join(
    process.cwd(),
    "content/public-reviews",
    options.reviewId,
    "versions",
    options.reviewVersion,
    "editorial"
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(editorialRoot, "manifest.json"), "utf8")
  ) as {
    pages: { id: string; title: string; file: string }[];
  };
  for (const pageId of Object.keys(corrections.pages)) {
    const page = manifest.pages.find((entry) => entry.id === pageId);
    if (!page) throw new Error(`Missing fixture page: ${pageId}`);
    const markdown = getCurrentStreamEditorialMarkdown({
      pageId,
      markdown: fs.readFileSync(path.join(editorialRoot, page.file), "utf8"),
      version: options.reviewVersion,
      source: corrections.source,
    });
    const expected = splitEditorialPage({
      markdown,
      page,
      reviewId: options.reviewId,
      reviewVersion: options.reviewVersion,
      sourceCommit: corrections.source.commit,
    });
    const actual = current.records.filter((record) =>
      record.id.startsWith(`editorial:${pageId}:`)
    );
    expect(actual.map((record) => record.text).sort()).toEqual(
      expected.map((record) => record.text).sort()
    );
    expect(
      actual.every((record) => !record.canonicalPath.includes("/versions/"))
    ).toBe(true);
  }
  const editorial = current.records.filter(
    (record) => record.category === "editorial"
  );
  expect(
    editorial.some((record) => record.text?.includes("in an earlier block"))
  ).toBe(false);
  expect(
    editorial.some((record) => record.text?.includes("same transaction"))
  ).toBe(true);
  expect(
    current.searchIndex.records.some(
      (record) =>
        record.category === "editorial" &&
        record.searchText.includes("in an earlier block")
    )
  ).toBe(false);
});

it("keeps technical evidence, saved records, inventory, and source identity intact", () => {
  expect(
    current.records.filter((record) => record.category === "technical")
  ).toEqual(source.records.filter((record) => record.category === "technical"));
  expect(
    current.searchIndex.records.filter(
      (record) => record.category === "technical"
    )
  ).toEqual(
    source.searchIndex.records.filter(
      (record) => record.category === "technical"
    )
  );
  expect(current.records.map((record) => record.id)).toEqual(
    source.records.map((record) => record.id)
  );
  expect(current.manifest.counts).toEqual(source.manifest.counts);
  expect(current.manifest.source).toEqual(source.manifest.source);
  expect(
    source.records.some((record) =>
      record.text?.includes("in an earlier block")
    )
  ).toBe(true);
  expect(directoryIdentity(sourceRoot)).toBe(sourceIdentity);
});

it("changes the cache identity and gives the bot the current launch card", () => {
  expect(current.manifest.knowledgeSha256).not.toBe(
    source.manifest.knowledgeSha256
  );
  expect(current.manifest.currentView?.sourceKnowledgeSha256).toBe(
    source.manifest.knowledgeSha256
  );
  const status = current.records.find(
    (record) => record.id === "status:latest-development"
  );
  expect(status?.structured?.summary).toBe(
    development["publicReview.development.summary"]
  );
  expect(status?.structured?.beforeLaunch).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        text: development["publicReview.development.beforeLaunch.connections"],
      }),
    ])
  );
  expect(status?.summary).toContain("complete system is unfinished");
});

it("keeps counts and detailed launch work retrievable within the backend evidence budget", () => {
  const saved = source.records.find(
    (record) => record.id === "status:latest-development"
  )?.structured;
  const record = current.records.find(
    (entry) => entry.id === "status:latest-development"
  );
  const search = current.searchIndex.records.find(
    (entry) => entry.id === "status:latest-development"
  );
  if (!saved || !record?.structured || !search)
    throw new Error("Missing status fixture.");
  const details = [
    saved.checkedAt,
    `${saved.evidenceSummary.requirements.missing} missing requirements`,
    `${saved.evidenceSummary.openReleaseBlockers} open release blockers in the saved risk register`,
    ...saved.recentlyCompleted.map((item) => item.text),
    ...saved.workingOn.map((item) => item.text),
    ...saved.beforeLaunch.map((item) => item.text),
  ];
  for (const fact of details) {
    expect(search.searchText).toContain(fact);
    expect(record.summary).toContain(fact);
  }
  expect(record.structured.beforeLaunch).toEqual(
    expect.arrayContaining(saved.beforeLaunch)
  );
  expect(search.searchText.length).toBeLessThanOrEqual(1_600);

  // The consumer selects these facts and falls back to a headline-only answer
  // above 2,300 characters. Keep the detailed status usable after adding copy.
  const status = record.structured;
  const evidence = {
    evidence: 0,
    id: record.id,
    category: record.category,
    kind: record.kind,
    title: record.title,
    canonicalPath: record.canonicalPath,
    sourceCommit: record.provenance.sourceCommit,
    structured: {
      checkedAt: status.checkedAt,
      state: status.state,
      headline: status.headline,
      summary: status.summary,
      evidenceSummary: status.evidenceSummary,
      recentlyCompleted: status.recentlyCompleted.map(({ id, text }) => ({
        id,
        text,
      })),
      workingOn: status.workingOn.map(({ id, text }) => ({ id, text })),
      beforeLaunch: status.beforeLaunch.map(({ id, text }) => ({ id, text })),
    },
  };
  expect(JSON.stringify(evidence).length).toBeLessThanOrEqual(2_300);
});

it("does not apply current corrections to a retained or unrelated version", () => {
  for (const changed of [
    { activeVersion: "2026-09-10.1" },
    { reviewVersion: "2026-07-26.1" },
    { reviewId: "unrelated" },
  ]) {
    expect(
      getStreamCurrentKnowledgeFiles({ ...options, ...changed }).size
    ).toBe(0);
  }
});

it("accepts the exact packaged projection and rejects altered evidence bytes", () => {
  expect(() =>
    assertPackagedKnowledge(sourceRoot, projectedRoot, files, "Stream")
  ).not.toThrow();
  const manifestPath = path.join(projectedRoot, "manifest.json");
  const original = fs.readFileSync(manifestPath);
  try {
    fs.writeFileSync(manifestPath, `${original.toString()} `);
    expect(() =>
      assertPackagedKnowledge(sourceRoot, projectedRoot, files, "Stream")
    ).toThrow("does not exactly match");
  } finally {
    fs.writeFileSync(manifestPath, original);
  }
  expect(() =>
    assertPackagedKnowledge(sourceRoot, projectedRoot, new Map(), "Stream")
  ).toThrow("does not exactly match");
});
