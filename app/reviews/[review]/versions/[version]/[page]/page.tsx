import { publicEnv } from "@/config/env";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import {
  generateStreamReviewRouteMetadata,
  renderStreamReviewRoutePage,
} from "@/lib/public-review/streamReviewPage";
import {
  isStreamReviewVersionPubliclyAvailable,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";

export const generateMetadata = generateStreamReviewRouteMetadata;
export default renderStreamReviewRoutePage;

export function generateStaticParams() {
  if (!isPublicReviewEnabled(publicEnv.BASE_ENDPOINT)) {
    return [];
  }

  return STREAM_REVIEW_DEFINITION.versions.flatMap((reviewVersion) =>
    isStreamReviewVersionPubliclyAvailable(reviewVersion.version)
      ? reviewVersion.pages
          .filter((page) => page.id !== "overview")
          .map((page) => ({
            review: STREAM_REVIEW_SLUG,
            version: reviewVersion.version,
            page: page.slug,
          }))
      : []
  );
}
