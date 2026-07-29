import publication from "@/config/public-reviews/6529-stream.publication.json";
import {
  isPublicReviewLifecycleState,
  type PublicReviewLifecycleState,
} from "@/lib/public-review/publicReviewLifecycle";

const STREAM_REVIEW_PUBLICATION_SCHEMA =
  "public-review.publication.v3" as const;
const STREAM_REVIEW_PUBLICATION_ID = "6529-stream" as const;
const STREAM_REVIEW_SOURCE_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const STREAM_REVIEW_VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}\.\d+$/;

export interface StreamReviewVersionIdentity {
  readonly lifecycleState: PublicReviewLifecycleState;
  readonly sourceCommit: string;
  readonly version: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseStreamReviewVersionIdentities(
  value: unknown
): readonly StreamReviewVersionIdentity[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("The Stream public-review version config is invalid.");
  }

  const seenVersions = new Set<string>();
  const identities = value.map((candidate) => {
    if (
      !isRecord(candidate) ||
      typeof candidate["version"] !== "string" ||
      !STREAM_REVIEW_VERSION_PATTERN.test(candidate["version"]) ||
      !isPublicReviewLifecycleState(candidate["lifecycleState"]) ||
      typeof candidate["sourceCommit"] !== "string" ||
      !STREAM_REVIEW_SOURCE_COMMIT_PATTERN.test(candidate["sourceCommit"]) ||
      seenVersions.has(candidate["version"])
    ) {
      throw new Error("The Stream public-review version config is invalid.");
    }
    seenVersions.add(candidate["version"]);
    return Object.freeze({
      lifecycleState: candidate["lifecycleState"],
      sourceCommit: candidate["sourceCommit"],
      version: candidate["version"],
    });
  });

  return Object.freeze(identities);
}

if (
  publication.schemaVersion !== STREAM_REVIEW_PUBLICATION_SCHEMA ||
  publication.reviewId !== STREAM_REVIEW_PUBLICATION_ID ||
  !isPublicReviewLifecycleState(publication.lifecycleState)
) {
  throw new Error("The Stream public-review publication config is invalid.");
}

export const STREAM_REVIEW_LIFECYCLE_STATE: PublicReviewLifecycleState =
  publication.lifecycleState;

export const STREAM_REVIEW_VERSION_IDENTITIES =
  parseStreamReviewVersionIdentities(publication.versions);

const STREAM_REVIEW_VERSION_LIFECYCLE_STATES = new Map<
  string,
  PublicReviewLifecycleState
>();
const STREAM_REVIEW_VERSION_SOURCE_COMMITS = new Map<string, string>();
for (const version of STREAM_REVIEW_VERSION_IDENTITIES) {
  STREAM_REVIEW_VERSION_LIFECYCLE_STATES.set(
    version.version,
    version.lifecycleState
  );
  STREAM_REVIEW_VERSION_SOURCE_COMMITS.set(
    version.version,
    version.sourceCommit
  );
}

export function getStreamReviewVersionLifecycleState(
  version: string
): PublicReviewLifecycleState {
  const lifecycleState = STREAM_REVIEW_VERSION_LIFECYCLE_STATES.get(version);
  if (!lifecycleState) {
    throw new Error(
      `The Stream public-review publication config is missing ${version}.`
    );
  }
  return lifecycleState;
}

export function getStreamReviewVersionSourceCommit(version: string): string {
  const sourceCommit = STREAM_REVIEW_VERSION_SOURCE_COMMITS.get(version);
  if (!sourceCommit) {
    throw new Error(
      `The Stream public-review publication config is missing the source commit for ${version}.`
    );
  }
  return sourceCommit;
}
