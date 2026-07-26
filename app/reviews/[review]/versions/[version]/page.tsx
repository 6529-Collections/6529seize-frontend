import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

export {
  renderStreamReviewRoutePage as default,
  generateStreamReviewRouteMetadata as generateMetadata,
} from "@/lib/public-review/streamReviewPage";

export function generateStaticParams() {
  if (!isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)) {
    return [];
  }

  return STREAM_REVIEW_DEFINITION.versions.map((reviewVersion) => ({
    review: STREAM_REVIEW_SLUG,
    version: reviewVersion.version,
  }));
}
