import "next/dist/compiled/server-only";

import developmentStatus from "@/config/public-reviews/6529-stream.development-status.json";
import { STREAM_REVIEW_PAGES } from "@/lib/public-review/streamReviewDefinition";

const CONFIG_ERROR = "The Stream development-status config is invalid.";
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const EVIDENCE_PATH_PATTERN =
  /^(?:docs|ops|release-artifacts)\/[A-Za-z0-9._/-]+$/;

export interface StreamDevelopmentItem {
  readonly id: string;
  readonly text: string;
  readonly evidencePath: string;
}

interface StreamDevelopmentReviewerPrompt {
  readonly id: string;
  readonly title: string;
  readonly question: string;
  readonly pageId: string;
  readonly sectionId: string;
}

interface StreamReviewDevelopmentStatus {
  readonly schemaVersion: "public-review.development-status.v1";
  readonly reviewId: "6529-stream";
  readonly locale: "en-US";
  readonly checkedAt: string;
  readonly source: {
    readonly repository: "6529-Collections/6529Stream";
    readonly commit: string;
  };
  readonly state: "PRE_AUDIT_DEVELOPMENT";
  readonly headline: string;
  readonly summary: string;
  readonly recentlyCompleted: readonly StreamDevelopmentItem[];
  readonly workingOn: readonly StreamDevelopmentItem[];
  readonly beforeLaunch: readonly StreamDevelopmentItem[];
  readonly evidenceSummary: {
    readonly requirements: {
      readonly complete: number;
      readonly pending: number;
      readonly missing: number;
    };
    readonly openReleaseBlockers: number;
  };
  readonly reviewerPrompts: readonly StreamDevelopmentReviewerPrompt[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isCanonicalId(value: string): boolean {
  return (
    value.length > 0 &&
    value
      .split("-")
      .every(
        (segment) =>
          segment.length > 0 &&
          [...segment].every(
            (character) =>
              (character >= "a" && character <= "z") ||
              (character >= "0" && character <= "9")
          )
      )
  );
}

function readText(
  record: Record<string, unknown>,
  key: string,
  maximumLength: number
): string {
  const value = record[key];
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    value.length > maximumLength
  ) {
    throw new Error(CONFIG_ERROR);
  }
  return value;
}

function readCount(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(CONFIG_ERROR);
  }
  return value as number;
}

function parseDevelopmentItems(
  value: unknown,
  seenIds: Set<string>
): readonly StreamDevelopmentItem[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 4) {
    throw new Error(CONFIG_ERROR);
  }

  return Object.freeze(
    value.map((candidate) => {
      if (!isRecord(candidate)) {
        throw new Error(CONFIG_ERROR);
      }
      const id = readText(candidate, "id", 64);
      const text = readText(candidate, "text", 240);
      const evidencePath = readText(candidate, "evidencePath", 180);
      const segments = new Set(evidencePath.split("/"));
      if (
        !isCanonicalId(id) ||
        seenIds.has(id) ||
        !EVIDENCE_PATH_PATTERN.test(evidencePath) ||
        evidencePath.includes("\\") ||
        segments.has(".") ||
        segments.has("..")
      ) {
        throw new Error(CONFIG_ERROR);
      }
      seenIds.add(id);
      return Object.freeze({ id, text, evidencePath });
    })
  );
}

function parseReviewerPrompts(
  value: unknown,
  seenIds: Set<string>
): readonly StreamDevelopmentReviewerPrompt[] {
  if (!Array.isArray(value) || value.length < 4 || value.length > 8) {
    throw new Error(CONFIG_ERROR);
  }
  const pageIds = new Set(STREAM_REVIEW_PAGES.map((page) => page.id));

  return Object.freeze(
    value.map((candidate) => {
      if (!isRecord(candidate)) {
        throw new Error(CONFIG_ERROR);
      }
      const id = readText(candidate, "id", 64);
      const title = readText(candidate, "title", 80);
      const question = readText(candidate, "question", 220);
      const pageId = readText(candidate, "pageId", 80);
      const sectionId = readText(candidate, "sectionId", 80);
      if (
        !isCanonicalId(id) ||
        seenIds.has(id) ||
        !pageIds.has(pageId) ||
        !isCanonicalId(sectionId)
      ) {
        throw new Error(CONFIG_ERROR);
      }
      seenIds.add(id);
      return Object.freeze({ id, title, question, pageId, sectionId });
    })
  );
}

export function parseStreamReviewDevelopmentStatus(
  value: unknown
): StreamReviewDevelopmentStatus {
  if (!isRecord(value) || !isRecord(value["source"])) {
    throw new Error(CONFIG_ERROR);
  }
  const checkedAt = readText(value, "checkedAt", 24);
  const parsedDate = new Date(checkedAt);
  const source = value["source"];
  const sourceCommit = readText(source, "commit", 40);
  const headline = readText(value, "headline", 240);
  const summary = readText(value, "summary", 360);
  if (
    value["schemaVersion"] !== "public-review.development-status.v1" ||
    value["reviewId"] !== "6529-stream" ||
    value["locale"] !== "en-US" ||
    value["state"] !== "PRE_AUDIT_DEVELOPMENT" ||
    readText(source, "repository", 80) !== "6529-Collections/6529Stream" ||
    !SHA_PATTERN.test(sourceCommit) ||
    !UTC_TIMESTAMP_PATTERN.test(checkedAt) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString() !== checkedAt ||
    !isRecord(value["evidenceSummary"])
  ) {
    throw new Error(CONFIG_ERROR);
  }

  const evidenceSummary = value["evidenceSummary"];
  if (!isRecord(evidenceSummary["requirements"])) {
    throw new Error(CONFIG_ERROR);
  }
  const requirements = evidenceSummary["requirements"];
  const seenIds = new Set<string>();

  return Object.freeze({
    schemaVersion: "public-review.development-status.v1",
    reviewId: "6529-stream",
    locale: "en-US",
    checkedAt,
    source: Object.freeze({
      repository: "6529-Collections/6529Stream",
      commit: sourceCommit,
    }),
    state: "PRE_AUDIT_DEVELOPMENT",
    headline,
    summary,
    recentlyCompleted: parseDevelopmentItems(
      value["recentlyCompleted"],
      seenIds
    ),
    workingOn: parseDevelopmentItems(value["workingOn"], seenIds),
    beforeLaunch: parseDevelopmentItems(value["beforeLaunch"], seenIds),
    evidenceSummary: Object.freeze({
      requirements: Object.freeze({
        complete: readCount(requirements, "complete"),
        pending: readCount(requirements, "pending"),
        missing: readCount(requirements, "missing"),
      }),
      openReleaseBlockers: readCount(evidenceSummary, "openReleaseBlockers"),
    }),
    reviewerPrompts: parseReviewerPrompts(value["reviewerPrompts"], seenIds),
  });
}

export const STREAM_REVIEW_DEVELOPMENT_STATUS =
  parseStreamReviewDevelopmentStatus(developmentStatus);
