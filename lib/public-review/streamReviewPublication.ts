import publication from "@/config/public-reviews/6529-stream.publication.json";
import {
  isPublicReviewLifecycleState,
  type PublicReviewLifecycleState,
} from "@/lib/public-review/publicReviewLifecycle";

const STREAM_REVIEW_PUBLICATION_SCHEMA =
  "public-review.publication.v1" as const;
const STREAM_REVIEW_PUBLICATION_ID = "6529-stream" as const;

if (
  publication.schemaVersion !== STREAM_REVIEW_PUBLICATION_SCHEMA ||
  publication.reviewId !== STREAM_REVIEW_PUBLICATION_ID ||
  !isPublicReviewLifecycleState(publication.lifecycleState)
) {
  throw new Error("The Stream public-review publication config is invalid.");
}

export const STREAM_REVIEW_LIFECYCLE_STATE: PublicReviewLifecycleState =
  publication.lifecycleState;
