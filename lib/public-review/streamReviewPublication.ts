import publication from "@/config/public-reviews/6529-stream.publication.json";
import {
  isPublicReviewLifecycleState,
  type PublicReviewLifecycleState,
} from "@/lib/public-review/publicReviewLifecycle";

const STREAM_REVIEW_PUBLICATION_SCHEMA =
  "public-review.publication.v2" as const;
const STREAM_REVIEW_PUBLICATION_ID = "6529-stream" as const;
const STREAM_REVIEW_DEPLOYMENT_STATUSES = ["NOT_DEPLOYED", "DEPLOYED"] as const;
const STREAM_REVIEW_AUDIT_STATUSES = [
  "PRE_AUDIT",
  "AUDIT_IN_PROGRESS",
  "AUDIT_COMPLETE",
] as const;

type StreamReviewDeploymentStatus =
  (typeof STREAM_REVIEW_DEPLOYMENT_STATUSES)[number];
type StreamReviewAuditStatus = (typeof STREAM_REVIEW_AUDIT_STATUSES)[number];
interface StreamReviewVersionPublication {
  readonly lifecycleState: PublicReviewLifecycleState;
  readonly deploymentStatus: StreamReviewDeploymentStatus;
  readonly auditStatus: StreamReviewAuditStatus;
}

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

if (
  publication.schemaVersion !== STREAM_REVIEW_PUBLICATION_SCHEMA ||
  publication.reviewId !== STREAM_REVIEW_PUBLICATION_ID ||
  !isPublicReviewLifecycleState(publication.lifecycleState) ||
  !Array.isArray(publication.versions) ||
  publication.versions.length === 0
) {
  throw new Error("The Stream public-review publication config is invalid.");
}

export const STREAM_REVIEW_LIFECYCLE_STATE: PublicReviewLifecycleState =
  publication.lifecycleState;

const STREAM_REVIEW_VERSION_PUBLICATIONS = new Map<
  string,
  StreamReviewVersionPublication
>();
for (const version of publication.versions) {
  if (
    typeof version.version !== "string" ||
    version.version.length === 0 ||
    !isPublicReviewLifecycleState(version.lifecycleState) ||
    !isStreamReviewDeploymentStatus(version.deploymentStatus) ||
    !isStreamReviewAuditStatus(version.auditStatus) ||
    STREAM_REVIEW_VERSION_PUBLICATIONS.has(version.version)
  ) {
    throw new Error("The Stream public-review version config is invalid.");
  }
  STREAM_REVIEW_VERSION_PUBLICATIONS.set(version.version, {
    lifecycleState: version.lifecycleState,
    deploymentStatus: version.deploymentStatus,
    auditStatus: version.auditStatus,
  });
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
  return getStreamReviewVersionPublication(version).lifecycleState;
}
