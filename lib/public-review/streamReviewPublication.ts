import publication from "@/config/public-reviews/6529-stream.publication.json";
import {
  isPublicReviewLifecycleState,
  type PublicReviewLifecycleState,
} from "@/lib/public-review/publicReviewLifecycle";

const STREAM_REVIEW_PUBLICATION_SCHEMA =
  "public-review.publication.v3" as const;
const STREAM_REVIEW_PUBLICATION_ID = "6529-stream" as const;
const STREAM_REVIEW_DEPLOYMENT_STATUSES = ["NOT_DEPLOYED", "DEPLOYED"] as const;
const STREAM_REVIEW_AUDIT_STATUSES = [
  "PRE_AUDIT",
  "AUDIT_IN_PROGRESS",
  "AUDIT_COMPLETE",
] as const;
const STREAM_REVIEW_SOURCE_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const STREAM_REVIEW_VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}\.\d+$/;
const STREAM_REVIEW_VERSION_CONFIG_ERROR =
  "The Stream public-review version config is invalid.";

type StreamReviewDeploymentStatus =
  (typeof STREAM_REVIEW_DEPLOYMENT_STATUSES)[number];
type StreamReviewAuditStatus = (typeof STREAM_REVIEW_AUDIT_STATUSES)[number];
export interface StreamReviewVersionIdentity {
  readonly lifecycleState: PublicReviewLifecycleState;
  readonly sourceCommit: string;
  readonly version: string;
}

interface StreamReviewPublicationMetadata {
  readonly deploymentStatus: StreamReviewDeploymentStatus;
  readonly auditStatus: StreamReviewAuditStatus;
}

interface StreamReviewVersionPublication
  extends StreamReviewVersionIdentity, StreamReviewPublicationMetadata {}

function isStreamReviewDeploymentStatus(
  value: unknown
): value is StreamReviewDeploymentStatus {
  return (
    typeof value === "string" &&
    (STREAM_REVIEW_DEPLOYMENT_STATUSES as readonly string[]).includes(value)
  );
}

function isStreamReviewAuditStatus(
  value: unknown
): value is StreamReviewAuditStatus {
  return (
    typeof value === "string" &&
    (STREAM_REVIEW_AUDIT_STATUSES as readonly string[]).includes(value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseStreamReviewPublicationMetadata(
  value: unknown,
  lifecycleState: PublicReviewLifecycleState
): StreamReviewPublicationMetadata | undefined {
  if (!isRecord(value)) {
    throw new Error(STREAM_REVIEW_VERSION_CONFIG_ERROR);
  }
  const deploymentStatus = value["deploymentStatus"];
  const auditStatus = value["auditStatus"];
  if (
    lifecycleState === "DRAFT" &&
    deploymentStatus === undefined &&
    auditStatus === undefined
  ) {
    return undefined;
  }
  if (
    !isStreamReviewDeploymentStatus(deploymentStatus) ||
    !isStreamReviewAuditStatus(auditStatus)
  ) {
    throw new Error(STREAM_REVIEW_VERSION_CONFIG_ERROR);
  }
  return Object.freeze({ deploymentStatus, auditStatus });
}

export function parseStreamReviewVersionIdentities(
  value: unknown
): readonly StreamReviewVersionIdentity[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(STREAM_REVIEW_VERSION_CONFIG_ERROR);
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
      throw new Error(STREAM_REVIEW_VERSION_CONFIG_ERROR);
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

const STREAM_REVIEW_VERSION_PUBLICATIONS = new Map<
  string,
  StreamReviewVersionPublication
>();
const STREAM_REVIEW_VERSION_LIFECYCLE_STATES = new Map<
  string,
  PublicReviewLifecycleState
>();
const STREAM_REVIEW_VERSION_SOURCE_COMMITS = new Map<string, string>();
for (const [index, identity] of STREAM_REVIEW_VERSION_IDENTITIES.entries()) {
  const version = publication.versions[index];
  if (!version) {
    throw new Error(STREAM_REVIEW_VERSION_CONFIG_ERROR);
  }
  STREAM_REVIEW_VERSION_LIFECYCLE_STATES.set(
    identity.version,
    identity.lifecycleState
  );
  STREAM_REVIEW_VERSION_SOURCE_COMMITS.set(
    identity.version,
    identity.sourceCommit
  );
  const metadata = parseStreamReviewPublicationMetadata(
    version,
    identity.lifecycleState
  );
  if (metadata) {
    STREAM_REVIEW_VERSION_PUBLICATIONS.set(
      identity.version,
      Object.freeze({
        ...identity,
        ...metadata,
      })
    );
  }
}

export function getStreamReviewVersionPublication(
  version: string
): StreamReviewVersionPublication {
  const versionPublication = STREAM_REVIEW_VERSION_PUBLICATIONS.get(version);
  if (!versionPublication) {
    throw new Error(
      `The Stream public-review publication config is missing ${version}.`
    );
  }
  return versionPublication;
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
