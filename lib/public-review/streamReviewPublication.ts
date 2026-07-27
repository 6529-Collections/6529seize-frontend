import publication from "@/config/public-reviews/6529-stream.publication.json";
import {
  isPublicReviewLifecycleState,
  type PublicReviewLifecycleState,
} from "@/lib/public-review/publicReviewLifecycle";

const STREAM_REVIEW_PUBLICATION_SCHEMA =
  "public-review.publication.v2" as const;
const STREAM_REVIEW_PUBLICATION_ID = "6529-stream" as const;

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

const STREAM_REVIEW_VERSION_LIFECYCLE_STATES = new Map<
  string,
  PublicReviewLifecycleState
>();
for (const version of publication.versions) {
  if (
    typeof version.version !== "string" ||
    version.version.length === 0 ||
    !isPublicReviewLifecycleState(version.lifecycleState) ||
    STREAM_REVIEW_VERSION_LIFECYCLE_STATES.has(version.version)
  ) {
    throw new Error("The Stream public-review version config is invalid.");
  }
  STREAM_REVIEW_VERSION_LIFECYCLE_STATES.set(
    version.version,
    version.lifecycleState
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
